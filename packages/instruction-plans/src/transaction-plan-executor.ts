import {
    isSolanaError,
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN,
    SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED,
    SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND,
    SolanaError,
} from '@solana/errors';
import type { Signature } from '@solana/keys';
import { getAbortablePromise } from '@solana/promises';
import type { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
import { getSignatureFromTransaction, type Transaction } from '@solana/transactions';

import type {
    ParallelTransactionPlan,
    SequentialTransactionPlan,
    SingleTransactionPlan,
    TransactionPlan,
} from './transaction-plan';
import { createFailedToExecuteTransactionPlanError } from './transaction-plan-errors';
import {
    BaseTransactionPlanResultContext,
    canceledSingleTransactionPlanResult,
    failedSingleTransactionPlanResult,
    parallelTransactionPlanResult,
    sequentialTransactionPlanResult,
    SingleTransactionPlanResult,
    successfulSingleTransactionPlanResult,
    successfulSingleTransactionPlanResultFromTransaction,
    type TransactionPlanResult,
    type TransactionPlanResultContext,
    type TransactionPlanResultContextWithSignature,
} from './transaction-plan-result';

/**
 * Executes a transaction plan and returns the execution results.
 *
 * This function traverses the transaction plan tree, executing each transaction
 * message and collecting results that mirror the structure of the original plan.
 *
 * The zero-argument spelling defaults `TContext` to {@link TransactionPlanResultContextWithSignature},
 * so its results guarantee a `context.signature` on every successful single result — but a different
 * `TContext` may drop that guarantee entirely.
 *
 * @typeParam TContext - The type of the context object that may be passed along with results.
 * @param transactionPlan - The transaction plan to execute.
 * @param config - Optional configuration object that can include an `AbortSignal` to cancel execution.
 * @return A promise that resolves to the execution results.
 *
 * @see {@link TransactionPlan}
 * @see {@link TransactionPlanResult}
 * @see {@link createTransactionPlanExecutor}
 */
export type TransactionPlanExecutor<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
> = (
    transactionPlan: TransactionPlan,
    config?: { abortSignal?: AbortSignal },
) => Promise<TransactionPlanResult<TContext>>;

type ExecuteTransactionMessage<
    TContext extends TransactionPlanResultContext,
    TReturn = Signature | TContext | Transaction,
> = (
    context: Partial<TContext>,
    transactionMessage: TransactionMessage & TransactionMessageWithFeePayer,
    config?: { abortSignal?: AbortSignal },
) => Promise<TReturn>;

/**
 * Configuration object for creating a new transaction plan executor.
 *
 * @see {@link createTransactionPlanExecutor}
 */
export type TransactionPlanExecutorConfig<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
> = {
    /**
     * Called whenever a transaction message must be sent to the blockchain.
     *
     * It should return the context that the successful result must carry — every property
     * `TContext` promises, which by default includes a `signature`. Returning a {@link Signature} or
     * a {@link Transaction} instead is deprecated.
     */
    executeTransactionMessage: ExecuteTransactionMessage<TContext>;
};

/**
 * Creates a new transaction plan executor based on the provided configuration.
 *
 * @param config - Configuration object containing the transaction message executor function.
 * @return A {@link TransactionPlanExecutor} function that can execute transaction plans.
 *
 * @deprecated Returning a `Signature` or a `Transaction` from `executeTransactionMessage` is
 * deprecated. Return the context that the successful result must carry instead — at minimum
 * `{ signature }`, or `{ signature, transaction }` to keep reporting the transaction:
 * ```diff
 *   executeTransactionMessage: async (context, message) => {
 *       const transaction = await signTransactionMessageWithSigners(message);
 * +     const signature = getSignatureFromTransaction(transaction);
 *       await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
 * -     return transaction;
 * +     return { signature, transaction };
 *   }
 * ```
 * Unlike this deprecated path, returning a context never derives a signature from a transaction, so
 * it also works for transactions their fee payer has not signed.
 *
 * @see {@link TransactionPlanExecutorConfig}
 */
export function createTransactionPlanExecutor<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(config: {
    executeTransactionMessage: ExecuteTransactionMessage<TContext, Signature | Transaction>;
}): TransactionPlanExecutor<TContext>;
/**
 * Creates a new transaction plan executor based on the provided configuration.
 *
 * The executor will traverse the provided `TransactionPlan` sequentially or in parallel,
 * executing each transaction message using the `executeTransactionMessage` function.
 *
 * The `executeTransactionMessage` callback receives a mutable context object as its first
 * argument, which can be used to incrementally store useful data as execution progresses
 * (e.g. the latest version of the transaction message after setting its lifetime, the
 * compiled and signed transaction, or any custom properties). This context is included
 * in the resulting {@link SingleTransactionPlanResult} regardless of the outcome. This
 * means that if an error is thrown at any point in the callback, any attributes already
 * saved to the context will still be available in the plan result, which can be useful
 * for debugging failures or building recovery plans.
 *
 * The callback should return the context that a successful result must carry — every property
 * `TContext` promises, which by default includes a `signature`, since the executor derives nothing
 * on the callback's behalf. On success the returned context is merged over the one the callback
 * mutated, with the returned value taking precedence, so a property stored on the context but left
 * out of the return value is still reported.
 *
 * ```ts
 * executeTransactionMessage: async (context, message) => {
 *     const transaction = await signTransactionMessageWithSigners(message);
 *     context.transaction = transaction; // Recorded now, in case the next step throws.
 *     const signature = getSignatureFromTransaction(transaction);
 *     await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
 *     return { signature, transaction };
 * }
 * ```
 *
 * Note that the callback cannot simply return the context it was given, since every property on it
 * is optional. Build the return value from the values you have instead.
 *
 * Returning a {@link Signature} or a full {@link Transaction} object instead of a context is
 * deprecated. Those return values are still honoured — a returned signature is stored as
 * `context.signature`, and a returned transaction is stored as `context.transaction` with its
 * signature derived from it — but deriving that signature throws
 * `SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING` when
 * the fee payer has not signed, which returning a context avoids.
 *
 * `TContext` is the only thing that says what a context contains — the executor adds nothing of its
 * own on top, in either direction. It defaults to {@link TransactionPlanResultContextWithSignature},
 * which is why the zero-type-argument spelling hands the callback the familiar `message`,
 * `transaction` and `signature` properties and guarantees a `context.signature` on every successful
 * result. Supply a different `TContext` and you get exactly that instead, so intersect one of the
 * base context types in if you want those properties alongside your own:
 *
 * ```ts
 * createTransactionPlanExecutor<TransactionPlanResultContextWithSignature & { startedAt: number }>(config);
 * ```
 *
 * Note the asymmetry between the callback and the result it produces. A fresh context is created for
 * every single transaction plan, so on entry it is empty and *every* property of `TContext` is
 * optional inside the callback — populating them is the callback's job, not a guarantee the executor
 * makes. The `TransactionPlanExecutor` this factory returns, on the other hand, reports the context
 * as fully populated. Declare the properties you intend to set as an explicit type argument to this
 * function; a callback cannot annotate its own context parameter with required properties, because
 * none of them are present when it is called.
 *
 * - If that function is successful, the executor will return a successful `TransactionPlanResult`
 * for that message, carrying the context described above.
 * - If that function throws an error, the executor will stop processing and cancel all
 * remaining transaction messages in the plan. The context accumulated up to the point of
 * failure is preserved in the resulting {@link FailedSingleTransactionPlanResult}, with a
 * `signature` derived from any `transaction` left on it. That derivation is unaffected by what the
 * callback returns — it never got the chance to return anything — so a callback that works with
 * transactions their fee payer has not signed should avoid storing them on the context, lest
 * deriving a signature from one replace the error it meant to report.
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
 *   executeTransactionMessage: async (context, message) => {
 *     const transaction = await signTransactionMessageWithSigners(message);
 *     context.transaction = transaction;
 *     const signature = getSignatureFromTransaction(transaction);
 *     await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
 *     return { signature, transaction };
 *   }
 * });
 * ```
 *
 * @see {@link TransactionPlanExecutorConfig}
 */
export function createTransactionPlanExecutor<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(config: TransactionPlanExecutorConfig<TContext>): TransactionPlanExecutor<TContext>;
export function createTransactionPlanExecutor<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(config: TransactionPlanExecutorConfig<TContext>): TransactionPlanExecutor<TContext> {
    return async (plan, { abortSignal } = {}): Promise<TransactionPlanResult<TContext>> => {
        const traverseConfig: TraverseConfig<TContext> = {
            ...config,
            abortSignal: abortSignal,
            canceled: abortSignal?.aborted ?? false,
        };

        // Fail early if there are non-divisible sequential plans in the
        // transaction plan as they are not supported by this executor.
        assertDivisibleSequentialPlansOnly(plan);

        const cancelHandler = () => {
            traverseConfig.canceled = true;
        };
        abortSignal?.addEventListener('abort', cancelHandler);
        const transactionPlanResult = await traverse<TContext>(plan, traverseConfig);
        abortSignal?.removeEventListener('abort', cancelHandler);

        if (traverseConfig.canceled) {
            const abortReason = abortSignal?.aborted ? abortSignal.reason : undefined;
            throw createFailedToExecuteTransactionPlanError(transactionPlanResult, abortReason);
        }

        return transactionPlanResult;
    };
}

type TraverseConfig<TContext extends TransactionPlanResultContext> = TransactionPlanExecutorConfig<TContext> & {
    abortSignal?: AbortSignal;
    canceled: boolean;
};

async function traverse<TContext extends TransactionPlanResultContext>(
    transactionPlan: TransactionPlan,
    traverseConfig: TraverseConfig<TContext>,
): Promise<TransactionPlanResult<TContext>> {
    const kind = transactionPlan.kind;
    switch (kind) {
        case 'sequential':
            return await traverseSequential(transactionPlan, traverseConfig);
        case 'parallel':
            return await traverseParallel(transactionPlan, traverseConfig);
        case 'single':
            return await traverseSingle(transactionPlan, traverseConfig);
        default:
            transactionPlan satisfies never;
            throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND, { kind });
    }
}

async function traverseSequential<TContext extends TransactionPlanResultContext>(
    transactionPlan: SequentialTransactionPlan,
    traverseConfig: TraverseConfig<TContext>,
): Promise<TransactionPlanResult<TContext>> {
    if (!transactionPlan.divisible) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED);
    }

    const results: TransactionPlanResult<TContext>[] = [];

    for (const subPlan of transactionPlan.plans) {
        const result = await traverse(subPlan, traverseConfig);
        results.push(result);
    }

    return sequentialTransactionPlanResult(results);
}

async function traverseParallel<TContext extends TransactionPlanResultContext>(
    transactionPlan: ParallelTransactionPlan,
    traverseConfig: TraverseConfig<TContext>,
): Promise<TransactionPlanResult<TContext>> {
    const results = await Promise.all(transactionPlan.plans.map(plan => traverse(plan, traverseConfig)));
    return parallelTransactionPlanResult(results);
}

async function traverseSingle<TContext extends TransactionPlanResultContext>(
    transactionPlan: SingleTransactionPlan,
    traverseConfig: TraverseConfig<TContext>,
): Promise<TransactionPlanResult<TContext>> {
    // A fresh context is created for every single transaction plan, so nothing is populated
    // yet. Filling it in is the `executeTransactionMessage` callback's job, which is why
    // every property of `TContext` is optional here. Note that `TContext` is the only thing
    // that says what a context contains; the executor adds no fields of its own.
    const context: Partial<TContext> = {};
    if (traverseConfig.canceled) {
        return canceledSingleTransactionPlanResult<TContext>(transactionPlan.message, context);
    }

    try {
        const result = await getAbortablePromise(
            traverseConfig.executeTransactionMessage(context, transactionPlan.message, {
                abortSignal: traverseConfig.abortSignal,
            }),
            traverseConfig.abortSignal,
        );
        // Only on the happy path do we claim the context is fully populated. Except when the
        // callback returned that context itself, we cannot verify that — the callback promised
        // these properties by way of `TContext` and we take it at its word — so this is the one
        // place an assertion is unavoidable.
        if (typeof result === 'string') {
            return successfulSingleTransactionPlanResult<TContext>(transactionPlan.message, {
                ...context,
                signature: result,
            } as unknown as TContext);
        }
        if (!isTransaction(result)) {
            // The callback told us what context the result should carry, so we take it as-is and
            // derive nothing from it. Anything it stored on the mutable context but left out of its
            // return value is kept, since dropping it would lose data the callback deliberately
            // recorded.
            return successfulSingleTransactionPlanResult<TContext>(transactionPlan.message, {
                ...context,
                ...result,
            });
        }
        return successfulSingleTransactionPlanResultFromTransaction<TContext>(
            transactionPlan.message,
            result,
            context as unknown as TContext,
        );
    } catch (error) {
        traverseConfig.canceled = true;
        // `TContext` no longer promises that a stored transaction is a `Transaction`, so this
        // reads it back through the base context's shape before narrowing it at runtime.
        const storedTransaction = context.transaction as BaseTransactionPlanResultContext['transaction'];
        const contextWithSignature =
            'transaction' in context && typeof storedTransaction === 'object' && context.signature == null
                ? { ...context, signature: getSignatureFromTransaction(storedTransaction) }
                : context;
        return failedSingleTransactionPlanResult<TContext>(
            transactionPlan.message,
            error as Error,
            contextWithSignature,
        );
    }
}

/**
 * Tells apart the two things the `executeTransactionMessage` callback may return once a
 * {@link Signature} has been ruled out: the deprecated {@link Transaction}, or the context a
 * successful result should carry. Since `TContext` alone decides what a context contains, a
 * returned context is not guaranteed to carry any particular property — not even a `signature` —
 * so this discriminates on the shape of a `Transaction` instead. Every `Transaction` keeps its
 * signatures in a `signatures` map, and no context type declares one, so that property is a
 * reliable discriminator.
 */
function isTransaction<TContext extends TransactionPlanResultContext>(
    returnValue: TContext | Transaction,
): returnValue is Transaction {
    return 'signatures' in returnValue;
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
 * @typeParam TContext - The type of the context object attached to the results. Any context is
 * accepted, since this helper never reads from it.
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
export async function passthroughFailedTransactionPlanExecution<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(promise: Promise<SingleTransactionPlanResult<TContext>>): Promise<SingleTransactionPlanResult<TContext>>;
export async function passthroughFailedTransactionPlanExecution<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(promise: Promise<TransactionPlanResult<TContext>>): Promise<TransactionPlanResult<TContext>>;
export async function passthroughFailedTransactionPlanExecution<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(promise: Promise<TransactionPlanResult<TContext>>): Promise<TransactionPlanResult<TContext>> {
    try {
        return await promise;
    } catch (error) {
        if (isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)) {
            return error.context.transactionPlanResult as TransactionPlanResult<TContext>;
        }
        throw error;
    }
}
