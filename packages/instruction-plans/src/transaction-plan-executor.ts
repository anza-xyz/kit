import {
    SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED,
    SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND,
    SolanaError,
} from '@solana/errors';
import { Signature } from '@solana/keys';
import { getAbortablePromise } from '@solana/promises';
import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
import { Transaction } from '@solana/transactions';

import type {
    ParallelTransactionPlan,
    SequentialTransactionPlan,
    SingleTransactionPlan,
    TransactionPlan,
} from './transaction-plan';
import {
    canceledSingleTransactionPlanResult,
    failedSingleTransactionPlanResult,
    parallelTransactionPlanResult,
    sequentialTransactionPlanResult,
    successfulSingleTransactionPlanResult,
    successfulSingleTransactionPlanResultFromSignature,
    type TransactionPlanResult,
    type TransactionPlanResultContext,
} from './transaction-plan-result';

export type TransactionPlanExecutor<TContext extends TransactionPlanResultContext = TransactionPlanResultContext> = (
    transactionPlan: TransactionPlan,
    config?: { abortSignal?: AbortSignal },
) => Promise<TransactionPlanResult<TContext>>;

type ExecuteResult<TContext extends TransactionPlanResultContext> = {
    context?: TContext;
} & ({ signature: Signature } | { transaction: Transaction });

type ExecuteTransactionMessage = <TContext extends TransactionPlanResultContext = TransactionPlanResultContext>(
    transactionMessage: TransactionMessage & TransactionMessageWithFeePayer,
    config?: { abortSignal?: AbortSignal },
) => Promise<ExecuteResult<TContext>>;

/**
 * Configuration object for creating a new transaction plan executor.
 *
 * @see {@link createTransactionPlanExecutor}
 */
export type TransactionPlanExecutorConfig = {
    /** Called whenever a transaction message must be sent to the blockchain. */
    executeTransactionMessage: ExecuteTransactionMessage;
};

/**
 * Creates a new transaction plan executor based on the provided configuration.
 *
 * The executor will traverse the provided `TransactionPlan` sequentially or in parallel,
 * executing each transaction message using the `executeTransactionMessage` function.
 *
 * - If that function is successful, the executor will return a successful `TransactionPlanResult`
 * for that message including the transaction and any custom context.
 * - If that function throws an error, the executor will stop processing and cancel all
 * remaining transaction messages in the plan.
 * - If the `abortSignal` is triggered, the executor will immediately stop processing the plan and
 * return a `TransactionPlanResult` with the status set to `canceled`.
 *
 * @example
 * ```ts
 * const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
 *
 * const transactionPlanExecutor = createTransactionPlanExecutor({
 *   executeTransactionMessage: (message) => {
 *     const transaction = await signTransactionMessageWithSigners(message);
 *     await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
 *     return { transaction };
 *   }
 * });
 * ```
 *
 * @see {@link TransactionPlannerConfig}
 */
export function createTransactionPlanExecutor(config: TransactionPlanExecutorConfig): TransactionPlanExecutor {
    return async (plan, { abortSignal } = {}): Promise<TransactionPlanResult> => {
        const context: TraverseContext = {
            ...config,
            abortSignal: abortSignal,
            canceled: abortSignal?.aborted ?? false,
        };

        // Fail early if there are non-divisible sequential plans in the
        // transaction plan as they are not supported by this executor.
        assertDivisibleSequentialPlansOnly(plan);

        const cancelHandler = () => {
            context.canceled = true;
        };
        abortSignal?.addEventListener('abort', cancelHandler);
        const transactionPlanResult = await traverse(plan, context);
        abortSignal?.removeEventListener('abort', cancelHandler);

        return transactionPlanResult;
    };
}

type TraverseContext = TransactionPlanExecutorConfig & {
    abortSignal?: AbortSignal;
    canceled: boolean;
};

async function traverse(transactionPlan: TransactionPlan, context: TraverseContext): Promise<TransactionPlanResult> {
    const kind = transactionPlan.kind;
    switch (kind) {
        case 'sequential':
            return await traverseSequential(transactionPlan, context);
        case 'parallel':
            return await traverseParallel(transactionPlan, context);
        case 'single':
            return await traverseSingle(transactionPlan, context);
        default:
            transactionPlan satisfies never;
            throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND, { kind });
    }
}

async function traverseSequential(
    transactionPlan: SequentialTransactionPlan,
    context: TraverseContext,
): Promise<TransactionPlanResult> {
    if (!transactionPlan.divisible) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED);
    }

    const results: TransactionPlanResult[] = [];

    for (const subPlan of transactionPlan.plans) {
        const result = await traverse(subPlan, context);
        results.push(result);
    }

    return sequentialTransactionPlanResult(results);
}

async function traverseParallel(
    transactionPlan: ParallelTransactionPlan,
    context: TraverseContext,
): Promise<TransactionPlanResult> {
    const results = await Promise.all(transactionPlan.plans.map(plan => traverse(plan, context)));
    return parallelTransactionPlanResult(results);
}

async function traverseSingle(
    transactionPlan: SingleTransactionPlan,
    context: TraverseContext,
): Promise<TransactionPlanResult> {
    if (context.canceled) {
        return canceledSingleTransactionPlanResult(transactionPlan.message, context.abortSignal?.reason);
    }

    try {
        const result = await getAbortablePromise(
            context.executeTransactionMessage(transactionPlan.message, { abortSignal: context.abortSignal }),
            context.abortSignal,
        );
        if ('transaction' in result) {
            return successfulSingleTransactionPlanResult(transactionPlan.message, result.transaction, result.context);
        } else {
            return successfulSingleTransactionPlanResultFromSignature(
                transactionPlan.message,
                result.signature,
                result.context,
            );
        }
    } catch (error) {
        context.canceled = true;
        return failedSingleTransactionPlanResult(transactionPlan.message, error as Error);
    }
}

function assertDivisibleSequentialPlansOnly(transactionPlan: TransactionPlan): void {
    const kind = transactionPlan.kind;
    switch (kind) {
        case 'sequential':
            if (!transactionPlan.divisible) {
                throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED);
            }
            for (const subPlan of transactionPlan.plans) {
                assertDivisibleSequentialPlansOnly(subPlan);
            }
            return;
        case 'parallel':
            for (const subPlan of transactionPlan.plans) {
                assertDivisibleSequentialPlansOnly(subPlan);
            }
            return;
        case 'single':
        default:
            return;
    }
}
