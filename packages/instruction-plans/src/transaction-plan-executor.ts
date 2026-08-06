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
import { getSignatureFromTransactionIfPresent, type Transaction } from '@solana/transactions';

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
    type SingleTransactionPlanResultWithOptionalSignature,
    successfulSingleTransactionPlanResult,
    successfulSingleTransactionPlanResultFromTransaction,
    successfulSingleTransactionPlanResultWithOptionalSignature,
    type TransactionPlanResult,
    type TransactionPlanResultContext,
    type TransactionPlanResultWithOptionalSignature,
} from './transaction-plan-result';

/**
 * Executes a transaction plan and returns the execution results.
 *
 * This function traverses the transaction plan tree, executing each transaction
 * message and collecting results that mirror the structure of the original plan.
 *
 * @typeParam TContext - The type of the context object that may be passed along with results.
 * @typeParam TSingle - The type of single transaction plan results this executor produces. Defaults
 * to {@link SingleTransactionPlanResult}. Executors created with `allowMissingFeePayerSignature`
 * produce {@link SingleTransactionPlanResultWithOptionalSignature} instead.
 * @param transactionPlan - The transaction plan to execute.
 * @param config - Optional configuration object that can include an `AbortSignal` to cancel execution.
 * @return A promise that resolves to the execution results.
 *
 * @see {@link TransactionPlan}
 * @see {@link TransactionPlanResult}
 * @see {@link createTransactionPlanExecutor}
 */
export type TransactionPlanExecutor<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TSingle extends SingleTransactionPlanResultWithOptionalSignature<TContext> = SingleTransactionPlanResult<TContext>,
> = (
    transactionPlan: TransactionPlan,
    config?: { abortSignal?: AbortSignal },
) => Promise<TransactionPlanResult<TContext, TransactionMessage & TransactionMessageWithFeePayer, TSingle>>;

type ExecuteTransactionMessage<TContext extends TransactionPlanResultContext> = (
    context: BaseTransactionPlanResultContext & TContext,
    transactionMessage: TransactionMessage & TransactionMessageWithFeePayer,
    config?: { abortSignal?: AbortSignal },
) => Promise<Signature | Transaction>;

/**
 * Configuration object for creating a new transaction plan executor.
 *
 * @see {@link createTransactionPlanExecutor}
 */
export type TransactionPlanExecutorConfig<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TAllowMissingFeePayerSignature extends boolean = false,
> = {
    /**
     * When `true`, a {@link Transaction} returned by `executeTransactionMessage` need not be signed
     * by its fee payer. Successful results then type `context.signature` as optional, and populate
     * it only when the fee payer slot happens to be filled.
     *
     * Use this for executors that hand transactions off rather than submitting them — for example
     * signing with an authority wallet and passing the result to a relayer that will pay the fee.
     *
     * @defaultValue `false`
     */
    allowMissingFeePayerSignature?: TAllowMissingFeePayerSignature;
    /** Called whenever a transaction message must be sent to the blockchain. */
    executeTransactionMessage: ExecuteTransactionMessage<TContext>;
};

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
 * for debugging failures or building recovery plans. The callback must return either a
 * {@link Signature} or a full {@link Transaction} object.
 *
 * - If that function is successful, the executor will return a successful `TransactionPlanResult`
 * for that message. The returned signature or transaction is stored in the context automatically.
 * - If that function throws an error, the executor will stop processing and cancel all
 * remaining transaction messages in the plan. The context accumulated up to the point of
 * failure is preserved in the resulting {@link FailedSingleTransactionPlanResult}.
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
 *     await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
 *     return transaction;
 *   }
 * });
 * ```
 *
 * @example
 * Producing partially signed transactions for a relayer to submit later:
 * ```ts
 * const executor = createTransactionPlanExecutor({
 *   allowMissingFeePayerSignature: true,
 *   executeTransactionMessage: async (context, message) => {
 *     const transaction = await partiallySignTransactionMessageWithSigners(message);
 *     context.transaction = transaction;
 *     return transaction;
 *   }
 * });
 * ```
 *
 * @see {@link TransactionPlanExecutorConfig}
 */
export function createTransactionPlanExecutor<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TAllowMissingFeePayerSignature extends boolean = false,
>(
    config: TransactionPlanExecutorConfig<TContext, TAllowMissingFeePayerSignature>,
): TransactionPlanExecutor<
    TContext,
    [TAllowMissingFeePayerSignature] extends [false]
        ? SingleTransactionPlanResult<TContext>
        : SingleTransactionPlanResultWithOptionalSignature<TContext>
> {
    type TSingle = [TAllowMissingFeePayerSignature] extends [false]
        ? SingleTransactionPlanResult<TContext>
        : SingleTransactionPlanResultWithOptionalSignature<TContext>;
    return async (plan, { abortSignal } = {}) => {
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
        const transactionPlanResult = await traverse(plan, traverseConfig);
        abortSignal?.removeEventListener('abort', cancelHandler);

        if (traverseConfig.canceled) {
            const abortReason = abortSignal?.aborted ? abortSignal.reason : undefined;
            throw createFailedToExecuteTransactionPlanError(transactionPlanResult, abortReason);
        }

        // The `allowMissingFeePayerSignature` branch in `traverseSingle` guarantees this, but the
        // conditional type cannot be resolved while `TAllowMissingFeePayerSignature` is unresolved.
        return transactionPlanResult as TransactionPlanResult<
            TContext,
            TransactionMessage & TransactionMessageWithFeePayer,
            TSingle
        >;
    };
}

type TraverseConfig<TContext extends TransactionPlanResultContext> = TransactionPlanExecutorConfig<
    TContext,
    boolean
> & {
    abortSignal?: AbortSignal;
    canceled: boolean;
};

async function traverse<TContext extends TransactionPlanResultContext>(
    transactionPlan: TransactionPlan,
    traverseConfig: TraverseConfig<TContext>,
): Promise<TransactionPlanResultWithOptionalSignature<TContext>> {
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
): Promise<TransactionPlanResultWithOptionalSignature<TContext>> {
    if (!transactionPlan.divisible) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED);
    }

    const results: TransactionPlanResultWithOptionalSignature<TContext>[] = [];

    for (const subPlan of transactionPlan.plans) {
        const result = await traverse(subPlan, traverseConfig);
        results.push(result);
    }

    return sequentialTransactionPlanResult(results);
}

async function traverseParallel<TContext extends TransactionPlanResultContext>(
    transactionPlan: ParallelTransactionPlan,
    traverseConfig: TraverseConfig<TContext>,
): Promise<TransactionPlanResultWithOptionalSignature<TContext>> {
    const results = await Promise.all(transactionPlan.plans.map(plan => traverse(plan, traverseConfig)));
    return parallelTransactionPlanResult(results);
}

async function traverseSingle<TContext extends TransactionPlanResultContext>(
    transactionPlan: SingleTransactionPlan,
    traverseConfig: TraverseConfig<TContext>,
): Promise<TransactionPlanResultWithOptionalSignature<TContext>> {
    const context = {} as BaseTransactionPlanResultContext & TContext;
    if (traverseConfig.canceled) {
        return canceledSingleTransactionPlanResult(transactionPlan.message, context);
    }

    try {
        const result = await getAbortablePromise(
            traverseConfig.executeTransactionMessage(context, transactionPlan.message, {
                abortSignal: traverseConfig.abortSignal,
            }),
            traverseConfig.abortSignal,
        );
        return typeof result === 'string'
            ? successfulSingleTransactionPlanResult(transactionPlan.message, { ...context, signature: result })
            : traverseConfig.allowMissingFeePayerSignature
              ? successfulSingleTransactionPlanResultWithOptionalSignature(transactionPlan.message, result, context)
              : successfulSingleTransactionPlanResultFromTransaction(transactionPlan.message, result, context);
    } catch (error) {
        traverseConfig.canceled = true;
        return failedSingleTransactionPlanResult(
            transactionPlan.message,
            error as Error,
            withDerivedSignature(context),
        );
    }
}

/**
 * Fills in the `signature` of a context from its `transaction`, when the transaction is signed by
 * its fee payer and no signature was recorded already.
 *
 * The key is omitted rather than set to `undefined` when the fee payer has not signed, so that
 * `'signature' in context` stays meaningful.
 *
 * Deriving the signature is strictly best-effort. This runs while a failed result is being built,
 * so a malformed `transaction` written by a buggy executor must not throw from here and displace
 * the execution error that we are actually reporting.
 */
function withDerivedSignature<TContext extends TransactionPlanResultContext>(
    context: BaseTransactionPlanResultContext & TContext,
): BaseTransactionPlanResultContext & TContext {
    if (context.signature != null || context.transaction == null) {
        return context;
    }
    let signature: Signature | undefined;
    try {
        signature = getSignatureFromTransactionIfPresent(context.transaction);
    } catch {
        return context;
    }
    return signature == null ? context : { ...context, signature };
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
 * Results produced by an executor created with `allowMissingFeePayerSignature` are accepted too,
 * and are returned with their successful leaves still typing `context.signature` as optional.
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
// The strict overloads above must stay first, so that a strict argument keeps resolving to a strict
// result exactly as it did before these looser overloads existed.
export async function passthroughFailedTransactionPlanExecution(
    promise: Promise<SingleTransactionPlanResultWithOptionalSignature>,
): Promise<SingleTransactionPlanResultWithOptionalSignature>;
export async function passthroughFailedTransactionPlanExecution(
    promise: Promise<TransactionPlanResultWithOptionalSignature>,
): Promise<TransactionPlanResultWithOptionalSignature>;
export async function passthroughFailedTransactionPlanExecution(
    promise: Promise<TransactionPlanResultWithOptionalSignature>,
): Promise<TransactionPlanResultWithOptionalSignature> {
    try {
        return await promise;
    } catch (error) {
        if (isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)) {
            return error.context.transactionPlanResult as TransactionPlanResultWithOptionalSignature;
        }
        throw error;
    }
}
