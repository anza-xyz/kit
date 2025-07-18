import {
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN,
    SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND,
    SolanaError,
} from '@solana/errors';
import { getAbortablePromise } from '@solana/promises';
import { BaseTransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
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
    nonDivisibleSequentialTransactionPlanResult,
    parallelTransactionPlanResult,
    sequentialTransactionPlanResult,
    successfulSingleTransactionPlanResult,
    type TransactionPlanResult,
    type TransactionPlanResultContext,
} from './transaction-plan-result';

export type TransactionPlanExecutor<TContext extends TransactionPlanResultContext = TransactionPlanResultContext> = (
    transactionPlan: TransactionPlan,
    config?: { abortSignal?: AbortSignal },
) => Promise<TransactionPlanResult<TContext>>;

type ExecuteTransactionMessage = <
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer,
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
>(
    transactionMessage: TTransactionMessage,
    config?: { abortSignal?: AbortSignal },
) => Promise<{ context?: TContext; transaction: Transaction }>;

/**
 * Configuration object for creating a new transaction plan executor.
 *
 * @see {@link createTransactionPlanExecutor}
 */
export type TransactionPlanExecutorConfig = {
    /** Called whenever a transaction message must be sent to the blockchain. */
    executeTransactionMessage: ExecuteTransactionMessage;
    /**
     * Defines the maximum number of plans that can be executed
     * concurrently inside a {@link ParallelTransactionPlan}.
     */
    maxConcurrentOperations?: number;
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

        const cancelHandler = () => {
            context.canceled = true;
        };
        abortSignal?.addEventListener('abort', cancelHandler);
        const transactionPlanResult = await traverse(plan, context);
        abortSignal?.removeEventListener('abort', cancelHandler);

        if (context.canceled) {
            const abortReason = abortSignal?.aborted ? abortSignal.reason : undefined;
            throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                cause: findErrorFromTransactionPlanResult(transactionPlanResult) ?? abortReason,
                transactionPlanResult,
            });
        }

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
    const results: TransactionPlanResult[] = [];

    for (const subPlan of transactionPlan.plans) {
        const result = await traverse(subPlan, context);
        results.push(result);
    }

    return transactionPlan.divisible
        ? sequentialTransactionPlanResult(results)
        : nonDivisibleSequentialTransactionPlanResult(results);
}

async function traverseParallel(
    transactionPlan: ParallelTransactionPlan,
    context: TraverseContext,
): Promise<TransactionPlanResult> {
    const results = await concurrentOperations(
        transactionPlan.plans.map(plan => () => traverse(plan, context)),
        context.maxConcurrentOperations,
    );

    return parallelTransactionPlanResult(results);
}

async function concurrentOperations<T>(operations: (() => Promise<T>)[], maxConcurrentOperations?: number) {
    const results: T[] = [];
    const thread = {
        fail: (_e: unknown) => {},
        unblock: () => {},
    };

    function okToContinue() {
        return new Promise<void>((resolve, reject) => {
            thread.fail = reject;
            thread.unblock = resolve;
        });
    }

    let numInFlightOperations = 0;
    for (let index = 0; index < operations.length; index++) {
        if (numInFlightOperations === maxConcurrentOperations) {
            await okToContinue();
        }

        numInFlightOperations++;
        operations[index]()
            .then(result => {
                results[index] = result;
                numInFlightOperations--;
                thread.unblock();
            })
            .catch(e => {
                numInFlightOperations--;
                thread.fail(e);
            });
    }

    while (numInFlightOperations > 0) {
        await okToContinue();
    }

    return results;
}

async function traverseSingle(
    transactionPlan: SingleTransactionPlan,
    context: TraverseContext,
): Promise<TransactionPlanResult> {
    if (context.canceled) {
        return canceledSingleTransactionPlanResult(transactionPlan.message);
    }

    try {
        const result = await getAbortablePromise(
            context.executeTransactionMessage(transactionPlan.message, { abortSignal: context.abortSignal }),
            context.abortSignal,
        );
        return successfulSingleTransactionPlanResult(transactionPlan.message, result.transaction, result.context);
    } catch (error) {
        context.canceled = true;
        return failedSingleTransactionPlanResult(transactionPlan.message, error as SolanaError);
    }
}

function findErrorFromTransactionPlanResult(result: TransactionPlanResult): SolanaError | undefined {
    if (result.kind === 'single') {
        return result.status.kind === 'failed' ? result.status.error : undefined;
    }
    for (const plan of result.plans) {
        const error = findErrorFromTransactionPlanResult(plan);
        if (error) {
            return error;
        }
    }
}
