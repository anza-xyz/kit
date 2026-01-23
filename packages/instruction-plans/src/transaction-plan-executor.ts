import {
    isSolanaError,
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN,
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
    SingleTransactionPlanResult,
    successfulSingleTransactionPlanResult,
    successfulSingleTransactionPlanResultFromSignature,
    type TransactionPlanResult,
    type TransactionPlanResultContext,
} from './transaction-plan-result';

/**
 * Executes a transaction plan and returns the execution results.
 *
 * This function traverses the transaction plan tree, executing each transaction
 * message and collecting results that mirror the structure of the original plan.
 *
 * @typeParam TContext - The type of the context object that may be passed along with successful results.
 * @param transactionPlan - The transaction plan to execute.
 * @param config - Optional configuration object that can include an `AbortSignal` to cancel execution.
 * @return A promise that resolves to the execution results.
 *
 * @see {@link TransactionPlan}
 * @see {@link TransactionPlanResult}
 * @see {@link createTransactionPlanExecutor}
 */
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
 * @param config - Configuration object containing the transaction message executor function.
 * @return A {@link TransactionPlanExecutor} function that can execute transaction plans.
 *
 * @throws {@link SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN}
 *   if any transaction in the plan fails to execute. The error context contains a
 *   `transactionPlanResult` property with the partial results up to the point of failure.
 * @throws {@link SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED}
 *   if the transaction plan contains non-divisible sequential plans, which are not
 *   supported by this executor.
 *
 * @example
 * ```ts
 * const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
 *
 * const transactionPlanExecutor = createTransactionPlanExecutor({
 *   executeTransactionMessage: async (message) => {
 *     const transaction = await signTransactionMessageWithSigners(message);
 *     await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
 *     return { transaction };
 *   }
 * });
 * ```
 *
 * @see {@link TransactionPlanExecutorConfig}
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

        if (context.canceled) {
            const abortReason = abortSignal?.aborted ? abortSignal.reason : undefined;
            const context = { cause: findErrorFromTransactionPlanResult(transactionPlanResult) ?? abortReason };
            // Here we want the `transactionPlanResult` to be available in the error context
            // so applications can create recovery plans but we don't want this object to be
            // serialized with the error. This is why we set it as a non-enumerable property.
            Object.defineProperty(context, 'transactionPlanResult', {
                configurable: false,
                enumerable: false,
                value: transactionPlanResult,
                writable: false,
            });
            throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, context);
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
        return canceledSingleTransactionPlanResult(transactionPlan.message);
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

function findErrorFromTransactionPlanResult(result: TransactionPlanResult): Error | undefined {
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

/**
 * Wraps a transaction plan execution promise to return a
 * {@link TransactionPlanResult} even on execution failure.
 *
 * When a transaction plan executor throws a
 * {@link SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN}
 * error, this helper catches it and returns the `TransactionPlanResult`
 * from the error context instead of throwing.
 *
 * This allows us to handle the result of an execution in a single unified way
 * instead of using try/catch and examine the `TransactionPlanResult` in both
 * success and failure cases.
 *
 * Any other errors are re-thrown as normal.
 *
 * @param promise - A promise returned by a transaction plan executor.
 * @return A promise that resolves to the transaction plan result, even if some transactions failed.
 *
 * @example
 * Handling failures using a single result object:
 * ```ts
 * const result = await passthroughFailedTransactionPlanExecution(
 *   transactionPlanExecutor(transactionPlan)
 * );
 *
 * const summary = summarizeTransactionPlanResult(result);
 * if (summary.successful) {
 *   console.log('All transactions executed successfully');
 * } else {
 *   console.log(`${summary.successfulTransactions.length} succeeded`);
 *   console.log(`${summary.failedTransactions.length} failed`);
 *   console.log(`${summary.canceledTransactions.length} canceled`);
 * }
 * ```
 *
 * @see {@link TransactionPlanResult}
 * @see {@link createTransactionPlanExecutor}
 * @see {@link summarizeTransactionPlanResult}
 */
export async function passthroughFailedTransactionPlanExecution(
    promise: Promise<SingleTransactionPlanResult>,
): Promise<SingleTransactionPlanResult>;
export async function passthroughFailedTransactionPlanExecution(
    promise: Promise<TransactionPlanResult>,
): Promise<TransactionPlanResult>;
export async function passthroughFailedTransactionPlanExecution(
    promise: Promise<TransactionPlanResult>,
): Promise<TransactionPlanResult> {
    try {
        return await promise;
    } catch (error) {
        if (isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)) {
            return error.context.transactionPlanResult as TransactionPlanResult;
        }
        throw error;
    }
}
