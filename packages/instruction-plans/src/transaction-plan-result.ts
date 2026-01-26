import {
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND,
    SolanaError,
} from '@solana/errors';
import { Signature } from '@solana/keys';
import { BaseTransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
import { getSignatureFromTransaction, Transaction } from '@solana/transactions';

/**
 * The result of executing a transaction plan.
 *
 * This is structured as a recursive tree of results that mirrors the structure
 * of the original transaction plan, capturing the execution status at each level.
 *
 * Namely, the following result types are supported:
 * - {@link SingleTransactionPlanResult} - A result for a single transaction message
 *   containing its execution status.
 * - {@link ParallelTransactionPlanResult} - A result containing other results that
 *   were executed in parallel.
 * - {@link SequentialTransactionPlanResult} - A result containing other results that
 *   were executed sequentially. It also retains the divisibility property from the
 *   original plan.
 *
 * @template TContext - The type of the context object that may be passed along with successful results
 *
 * @see {@link SingleTransactionPlanResult}
 * @see {@link ParallelTransactionPlanResult}
 * @see {@link SequentialTransactionPlanResult}
 * @see {@link TransactionPlanResultStatus}
 */
export type TransactionPlanResult<TContext extends TransactionPlanResultContext = TransactionPlanResultContext> =
    | ParallelTransactionPlanResult<TContext>
    | SequentialTransactionPlanResult<TContext>
    | SingleTransactionPlanResult<TContext>;

/** A context object that may be passed along with successful results. */
export type TransactionPlanResultContext = Record<number | string | symbol, unknown>;

/**
 * A result for a sequential transaction plan.
 *
 * This represents the execution result of a {@link SequentialTransactionPlan} and
 * contains child results that were executed sequentially. It also retains the
 * divisibility property from the original plan.
 *
 * You may use the {@link sequentialTransactionPlanResult} and
 * {@link nonDivisibleSequentialTransactionPlanResult} helpers to create objects of this type.
 *
 * @template TContext - The type of the context object that may be passed along with successful results
 *
 * @example
 * ```ts
 * const result = sequentialTransactionPlanResult([
 *   singleResultA,
 *   singleResultB,
 * ]);
 * result satisfies SequentialTransactionPlanResult;
 * ```
 *
 * @example
 * Non-divisible sequential result.
 * ```ts
 * const result = nonDivisibleSequentialTransactionPlanResult([
 *   singleResultA,
 *   singleResultB,
 * ]);
 * result satisfies SequentialTransactionPlanResult & { divisible: false };
 * ```
 *
 * @see {@link sequentialTransactionPlanResult}
 * @see {@link nonDivisibleSequentialTransactionPlanResult}
 */
export type SequentialTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
> = Readonly<{
    divisible: boolean;
    kind: 'sequential';
    plans: TransactionPlanResult<TContext>[];
}>;

/**
 * A result for a parallel transaction plan.
 *
 * This represents the execution result of a {@link ParallelTransactionPlan} and
 * contains child results that were executed in parallel.
 *
 * You may use the {@link parallelTransactionPlanResult} helper to create objects of this type.
 *
 * @template TContext - The type of the context object that may be passed along with successful results
 *
 * @example
 * ```ts
 * const result = parallelTransactionPlanResult([
 *   singleResultA,
 *   singleResultB,
 * ]);
 * result satisfies ParallelTransactionPlanResult;
 * ```
 *
 * @see {@link parallelTransactionPlanResult}
 */
export type ParallelTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
> = Readonly<{
    kind: 'parallel';
    plans: TransactionPlanResult<TContext>[];
}>;

/**
 * A result for a single transaction plan.
 *
 * This represents the execution result of a {@link SingleTransactionPlan} and
 * contains the original transaction message along with its execution status.
 *
 * You may use the {@link successfulSingleTransactionPlanResult},
 * {@link failedSingleTransactionPlanResult}, or {@link canceledSingleTransactionPlanResult}
 * helpers to create objects of this type.
 *
 * @template TContext - The type of the context object that may be passed along with successful results
 * @template TTransactionMessage - The type of the transaction message
 *
 * @example
 * Successful result with a transaction and context.
 * ```ts
 * const result = successfulSingleTransactionPlanResult(
 *   transactionMessage,
 *   transaction
 * );
 * result satisfies SingleTransactionPlanResult;
 * ```
 *
 * @example
 * Failed result with an error.
 * ```ts
 * const result = failedSingleTransactionPlanResult(
 *   transactionMessage,
 *   new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
 * );
 * result satisfies SingleTransactionPlanResult;
 * ```
 *
 * @example
 * Canceled result.
 * ```ts
 * const result = canceledSingleTransactionPlanResult(transactionMessage);
 * result satisfies SingleTransactionPlanResult;
 * ```
 *
 * @see {@link successfulSingleTransactionPlanResult}
 * @see {@link failedSingleTransactionPlanResult}
 * @see {@link canceledSingleTransactionPlanResult}
 */
export type SingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer = BaseTransactionMessage &
    TransactionMessageWithFeePayer,
> = Readonly<{
    kind: 'single';
    message: TTransactionMessage;
    status: TransactionPlanResultStatus<TContext>;
}>;

/**
 * The status of a single transaction plan execution.
 *
 * This represents the outcome of executing a single transaction message and can be one of:
 * - `successful` - The transaction was successfully executed. Contains the transaction
 *   and an optional context object.
 * - `failed` - The transaction execution failed. Contains the error that caused the failure.
 * - `canceled` - The transaction execution was canceled.
 *
 * @template TContext - The type of the context object that may be passed along with successful results
 */
export type TransactionPlanResultStatus<TContext extends TransactionPlanResultContext = TransactionPlanResultContext> =
    | Readonly<{ context: TContext; kind: 'successful'; signature: Signature; transaction?: Transaction }>
    | Readonly<{ error: Error; kind: 'failed' }>
    | Readonly<{ kind: 'canceled' }>;

/**
 * Creates a divisible {@link SequentialTransactionPlanResult} from an array of nested results.
 *
 * This function creates a sequential result with the `divisible` property set to `true`,
 * indicating that the nested plans were executed sequentially but could have been
 * split into separate transactions or batches.
 *
 * @template TContext - The type of the context object that may be passed along with successful results
 * @param plans - The child results that were executed sequentially
 *
 * @example
 * ```ts
 * const result = sequentialTransactionPlanResult([
 *   singleResultA,
 *   singleResultB,
 * ]);
 * result satisfies SequentialTransactionPlanResult & { divisible: true };
 * ```
 *
 * @see {@link SequentialTransactionPlanResult}
 */
export function sequentialTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
>(plans: TransactionPlanResult<TContext>[]): SequentialTransactionPlanResult<TContext> & { divisible: true } {
    return Object.freeze({ divisible: true, kind: 'sequential', plans });
}

/**
 * Creates a non-divisible {@link SequentialTransactionPlanResult} from an array of nested results.
 *
 * This function creates a sequential result with the `divisible` property set to `false`,
 * indicating that the nested plans were executed sequentially and could not have been
 * split into separate transactions or batches (e.g., they were executed as a transaction bundle).
 *
 * @template TContext - The type of the context object that may be passed along with successful results
 * @param plans - The child results that were executed sequentially
 *
 * @example
 * ```ts
 * const result = nonDivisibleSequentialTransactionPlanResult([
 *   singleResultA,
 *   singleResultB,
 * ]);
 * result satisfies SequentialTransactionPlanResult & { divisible: false };
 * ```
 *
 * @see {@link SequentialTransactionPlanResult}
 */
export function nonDivisibleSequentialTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
>(plans: TransactionPlanResult<TContext>[]): SequentialTransactionPlanResult<TContext> & { divisible: false } {
    return Object.freeze({ divisible: false, kind: 'sequential', plans });
}

/**
 * Creates a {@link ParallelTransactionPlanResult} from an array of nested results.
 *
 * This function creates a parallel result indicating that the nested plans
 * were executed in parallel.
 *
 * @template TContext - The type of the context object that may be passed along with successful results
 * @param plans - The child results that were executed in parallel
 *
 * @example
 * ```ts
 * const result = parallelTransactionPlanResult([
 *   singleResultA,
 *   singleResultB,
 * ]);
 * result satisfies ParallelTransactionPlanResult;
 * ```
 *
 * @see {@link ParallelTransactionPlanResult}
 */
export function parallelTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
>(plans: TransactionPlanResult<TContext>[]): ParallelTransactionPlanResult<TContext> {
    return Object.freeze({ kind: 'parallel', plans });
}

/**
 * Creates a successful {@link SingleTransactionPlanResult} from a transaction message and transaction.
 *
 * This function creates a single result with a 'successful' status, indicating that
 * the transaction was successfully executed. It also includes the original transaction
 * message, the executed transaction, and an optional context object.
 *
 * @template TContext - The type of the context object
 * @template TTransactionMessage - The type of the transaction message
 * @param transactionMessage - The original transaction message
 * @param transaction - The successfully executed transaction
 * @param context - Optional context object to be included with the result
 *
 * @example
 * ```ts
 * const result = successfulSingleTransactionPlanResult(
 *   transactionMessage,
 *   transaction
 * );
 * result satisfies SingleTransactionPlanResult;
 * ```
 *
 * @see {@link SingleTransactionPlanResult}
 */
export function successfulSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer = BaseTransactionMessage &
    TransactionMessageWithFeePayer,
>(
    transactionMessage: TTransactionMessage,
    transaction: Transaction,
    context?: TContext,
): SingleTransactionPlanResult<TContext, TTransactionMessage> {
    return Object.freeze({
        kind: 'single',
        message: transactionMessage,
        status: Object.freeze({
            context: context ?? ({} as TContext),
            kind: 'successful',
            signature: getSignatureFromTransaction(transaction),
            transaction,
        }),
    });
}

/**
 * Creates a successful {@link SingleTransactionPlanResult} from a transaction message and signature.
 *
 * This function creates a single result with a 'successful' status, indicating that
 * the transaction was successfully executed. It also includes the original transaction
 * message, the signature of the executed transaction, and an optional context object.
 *
 * @template TContext - The type of the context object
 * @template TTransactionMessage - The type of the transaction message
 * @param transactionMessage - The original transaction message
 * @param signature - The signature of the successfully executed transaction
 * @param context - Optional context object to be included with the result
 *
 * @example
 * ```ts
 * const result = successfulSingleTransactionPlanResult(
 *   transactionMessage,
 *   signature
 * );
 * result satisfies SingleTransactionPlanResult;
 * ```
 *
 * @see {@link SingleTransactionPlanResult}
 */
export function successfulSingleTransactionPlanResultFromSignature<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer = BaseTransactionMessage &
    TransactionMessageWithFeePayer,
>(
    transactionMessage: TTransactionMessage,
    signature: Signature,
    context?: TContext,
): SingleTransactionPlanResult<TContext, TTransactionMessage> {
    return Object.freeze({
        kind: 'single',
        message: transactionMessage,
        status: Object.freeze({ context: context ?? ({} as TContext), kind: 'successful', signature }),
    });
}

/**
 * Creates a failed {@link SingleTransactionPlanResult} from a transaction message and error.
 *
 * This function creates a single result with a 'failed' status, indicating that
 * the transaction execution failed. It includes the original transaction message
 * and the error that caused the failure.
 *
 * @template TContext - The type of the context object (not used in failed results)
 * @template TTransactionMessage - The type of the transaction message
 * @param transactionMessage - The original transaction message
 * @param error - The error that caused the transaction to fail
 *
 * @example
 * ```ts
 * const result = failedSingleTransactionPlanResult(
 *   transactionMessage,
 *   new SolanaError({
 *     code: 123,
 *     message: 'Transaction simulation failed',
 *   }),
 * );
 * result satisfies SingleTransactionPlanResult;
 * ```
 *
 * @see {@link SingleTransactionPlanResult}
 */
export function failedSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer = BaseTransactionMessage &
    TransactionMessageWithFeePayer,
>(transactionMessage: TTransactionMessage, error: Error): SingleTransactionPlanResult<TContext, TTransactionMessage> {
    return Object.freeze({
        kind: 'single',
        message: transactionMessage,
        status: Object.freeze({ error, kind: 'failed' }),
    });
}

/**
 * Creates a canceled {@link SingleTransactionPlanResult} from a transaction message.
 *
 * This function creates a single result with a 'canceled' status, indicating that
 * the transaction execution was canceled. It includes the original transaction message.
 *
 * @template TContext - The type of the context object (not used in canceled results)
 * @template TTransactionMessage - The type of the transaction message
 * @param transactionMessage - The original transaction message
 *
 * @example
 * ```ts
 * const result = canceledSingleTransactionPlanResult(transactionMessage);
 * result satisfies SingleTransactionPlanResult;
 * ```
 *
 * @see {@link SingleTransactionPlanResult}
 */
export function canceledSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer = BaseTransactionMessage &
    TransactionMessageWithFeePayer,
>(transactionMessage: TTransactionMessage): SingleTransactionPlanResult<TContext, TTransactionMessage> {
    return Object.freeze({
        kind: 'single',
        message: transactionMessage,
        status: Object.freeze({ kind: 'canceled' }),
    });
}

/**
 * Finds the first transaction plan result in the tree that matches the given predicate.
 *
 * This function performs a depth-first search through the transaction plan result tree,
 * returning the first result that satisfies the predicate. It checks the root result
 * first, then recursively searches through nested results.
 *
 * @param transactionPlanResult - The transaction plan result tree to search.
 * @param predicate - A function that returns `true` for the result to find.
 * @returns The first matching transaction plan result, or `undefined` if no match is found.
 *
 * @example
 * Finding a failed transaction result.
 * ```ts
 * const result = parallelTransactionPlanResult([
 *   successfulSingleTransactionPlanResult(messageA, transactionA),
 *   failedSingleTransactionPlanResult(messageB, error),
 * ]);
 *
 * const failed = findTransactionPlanResult(
 *   result,
 *   (r) => r.kind === 'single' && r.status.kind === 'failed',
 * );
 * // Returns the failed single transaction plan result for messageB.
 * ```
 *
 * @see {@link TransactionPlanResult}
 * @see {@link everyTransactionPlanResult}
 * @see {@link transformTransactionPlanResult}
 * @see {@link flattenTransactionPlanResult}
 */
export function findTransactionPlanResult<TContext extends TransactionPlanResultContext = TransactionPlanResultContext>(
    transactionPlanResult: TransactionPlanResult<TContext>,
    predicate: (result: TransactionPlanResult<TContext>) => boolean,
): TransactionPlanResult<TContext> | undefined {
    if (predicate(transactionPlanResult)) {
        return transactionPlanResult;
    }
    if (transactionPlanResult.kind === 'single') {
        return undefined;
    }
    for (const subResult of transactionPlanResult.plans) {
        const foundResult = findTransactionPlanResult(subResult, predicate);
        if (foundResult) {
            return foundResult;
        }
    }
    return undefined;
}

/**
 * Retrieves the first failed transaction plan result from a transaction plan result tree.
 *
 * This function searches the transaction plan result tree using a depth-first traversal
 * and returns the first single transaction result with a 'failed' status. If no failed
 * result is found, it throws a {@link SolanaError}.
 *
 * @param transactionPlanResult - The transaction plan result tree to search.
 * @return The first failed single transaction plan result.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND` if no
 * failed transaction plan result is found. The error context contains a non-enumerable
 * `transactionPlanResult` property for recovery purposes.
 *
 * @example
 * Retrieving the first failed result from a parallel execution.
 * ```ts
 * const result = parallelTransactionPlanResult([
 *   successfulSingleTransactionPlanResult(messageA, transactionA),
 *   failedSingleTransactionPlanResult(messageB, error),
 *   failedSingleTransactionPlanResult(messageC, anotherError),
 * ]);
 *
 * const firstFailed = getFirstFailedSingleTransactionPlanResult(result);
 * // Returns the failed result for messageB.
 * ```
 *
 * @see {@link FailedSingleTransactionPlanResult}
 * @see {@link findTransactionPlanResult}
 */
export function getFirstFailedSingleTransactionPlanResult(
    transactionPlanResult: TransactionPlanResult,
): FailedSingleTransactionPlanResult {
    const result = findTransactionPlanResult(
        transactionPlanResult,
        r => r.kind === 'single' && r.status.kind === 'failed',
    );

    if (!result) {
        // Here we want the `transactionPlanResult` to be available in the error context
        // so applications can recover but we don't want this object to be
        // serialized with the error. This is why we set it as a non-enumerable property.
        const context = {};
        Object.defineProperty(context, 'transactionPlanResult', {
            configurable: false,
            enumerable: false,
            value: transactionPlanResult,
            writable: false,
        });
        throw new SolanaError(
            SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND,
            context,
        );
    }

    return result as FailedSingleTransactionPlanResult;
}

/**
 * Checks if every transaction plan result in the tree satisfies the given predicate.
 *
 * This function performs a depth-first traversal through the transaction plan result tree,
 * returning `true` only if the predicate returns `true` for every result in the tree
 * (including the root result and all nested results).
 *
 * @param transactionPlanResult - The transaction plan result tree to check.
 * @param predicate - A function that returns `true` if the result satisfies the condition.
 * @return `true` if every result in the tree satisfies the predicate, `false` otherwise.
 *
 * @example
 * Checking if all transactions were successful.
 * ```ts
 * const result = parallelTransactionPlanResult([
 *   successfulSingleTransactionPlanResult(messageA, transactionA),
 *   successfulSingleTransactionPlanResult(messageB, transactionB),
 * ]);
 *
 * const allSuccessful = everyTransactionPlanResult(
 *   result,
 *   (r) => r.kind !== 'single' || r.status.kind === 'successful',
 * );
 * // Returns true because all single results are successful.
 * ```
 *
 * @example
 * Checking if no transactions were canceled.
 * ```ts
 * const result = sequentialTransactionPlanResult([resultA, resultB, resultC]);
 *
 * const noCanceled = everyTransactionPlanResult(
 *   result,
 *   (r) => r.kind !== 'single' || r.status.kind !== 'canceled',
 * );
 * ```
 *
 * @see {@link TransactionPlanResult}
 * @see {@link findTransactionPlanResult}
 * @see {@link transformTransactionPlanResult}
 * @see {@link flattenTransactionPlanResult}
 */
export function everyTransactionPlanResult(
    transactionPlanResult: TransactionPlanResult,
    predicate: (plan: TransactionPlanResult) => boolean,
): boolean {
    if (!predicate(transactionPlanResult)) {
        return false;
    }
    if (transactionPlanResult.kind === 'single') {
        return true;
    }
    return transactionPlanResult.plans.every(p => everyTransactionPlanResult(p, predicate));
}

/**
 * Transforms a transaction plan result tree using a bottom-up approach.
 *
 * This function recursively traverses the transaction plan result tree, applying the
 * transformation function to each result. The transformation is applied bottom-up,
 * meaning nested results are transformed first, then the parent results receive
 * the already-transformed children before being transformed themselves.
 *
 * All transformed results are frozen using `Object.freeze` to ensure immutability.
 *
 * @param transactionPlanResult - The transaction plan result tree to transform.
 * @param fn - A function that transforms each result and returns a new result.
 * @return A new transformed transaction plan result tree.
 *
 * @example
 * Converting all canceled results to failed results.
 * ```ts
 * const result = parallelTransactionPlanResult([
 *   successfulSingleTransactionPlanResult(messageA, transactionA),
 *   canceledSingleTransactionPlanResult(messageB),
 * ]);
 *
 * const transformed = transformTransactionPlanResult(result, (r) => {
 *   if (r.kind === 'single' && r.status.kind === 'canceled') {
 *     return failedSingleTransactionPlanResult(r.message, new Error('Execution canceled'));
 *   }
 *   return r;
 * });
 * ```
 *
 * @see {@link TransactionPlanResult}
 * @see {@link findTransactionPlanResult}
 * @see {@link everyTransactionPlanResult}
 * @see {@link flattenTransactionPlanResult}
 */
export function transformTransactionPlanResult(
    transactionPlanResult: TransactionPlanResult,
    fn: (plan: TransactionPlanResult) => TransactionPlanResult,
): TransactionPlanResult {
    if (transactionPlanResult.kind === 'single') {
        return Object.freeze(fn(transactionPlanResult));
    }
    return Object.freeze(
        fn(
            Object.freeze({
                ...transactionPlanResult,
                plans: transactionPlanResult.plans.map(p => transformTransactionPlanResult(p, fn)),
            }),
        ),
    );
}

/**
 * Retrieves all individual {@link SingleTransactionPlanResult} instances from a transaction plan result tree.
 *
 * This function recursively traverses any nested structure of transaction plan results and extracts
 * all the single results they contain. It's useful when you need to access all the individual
 * transaction results, regardless of their organization in the result tree (parallel or sequential).
 *
 * @param result - The transaction plan result to extract single results from
 * @returns An array of all single transaction plan results contained in the tree
 *
 * @example
 * ```ts
 * const result = parallelTransactionPlanResult([
 *   sequentialTransactionPlanResult([resultA, resultB]),
 *   nonDivisibleSequentialTransactionPlanResult([resultC, resultD]),
 *   resultE,
 * ]);
 *
 * const singleResults = flattenTransactionPlanResult(result);
 * // Array of `SingleTransactionPlanResult` containing:
 * // resultA, resultB, resultC, resultD and resultE.
 * ```
 *
 * @see {@link TransactionPlanResult}
 * @see {@link findTransactionPlanResult}
 * @see {@link everyTransactionPlanResult}
 * @see {@link transformTransactionPlanResult}
 */
export function flattenTransactionPlanResult(result: TransactionPlanResult): SingleTransactionPlanResult[] {
    if (result.kind === 'single') {
        return [result];
    }
    return result.plans.flatMap(flattenTransactionPlanResult);
}

/**
 * A {@link SingleTransactionPlanResult} with 'successful' status.
 */
export type SuccessfulSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
> = SingleTransactionPlanResult<TContext> & { status: { kind: 'successful' } };

/**
 * A {@link SingleTransactionPlanResult} with 'failed' status.
 */
export type FailedSingleTransactionPlanResult = SingleTransactionPlanResult & { status: { kind: 'failed' } };

/**
 * A {@link SingleTransactionPlanResult} with 'canceled' status.
 */
export type CanceledSingleTransactionPlanResult = SingleTransactionPlanResult & { status: { kind: 'canceled' } };

/**
 * A summary of a {@link TransactionPlanResult}, categorizing transactions by their execution status.
 * - `successful`: Indicates whether all transactions were successful (i.e., no failed or canceled transactions).
 * - `successfulTransactions`: An array of successful transactions, each including its signature.
 * - `failedTransactions`: An array of failed transactions, each including the error that caused the failure.
 * - `canceledTransactions`: An array of canceled transactions.
 */
export type TransactionPlanResultSummary = Readonly<{
    canceledTransactions: CanceledSingleTransactionPlanResult[];
    failedTransactions: FailedSingleTransactionPlanResult[];
    successful: boolean;
    successfulTransactions: SuccessfulSingleTransactionPlanResult[];
}>;

/**
 * Summarize a {@link TransactionPlanResult} into a {@link TransactionPlanResultSummary}.
 * @param result The transaction plan result to summarize
 * @returns A summary of the transaction plan result
 */
export function summarizeTransactionPlanResult(result: TransactionPlanResult): TransactionPlanResultSummary {
    const successfulTransactions: TransactionPlanResultSummary['successfulTransactions'] = [];
    const failedTransactions: TransactionPlanResultSummary['failedTransactions'] = [];
    const canceledTransactions: TransactionPlanResultSummary['canceledTransactions'] = [];

    const flattenedResults = flattenTransactionPlanResult(result);

    for (const singleResult of flattenedResults) {
        switch (singleResult.status.kind) {
            case 'successful': {
                successfulTransactions.push(singleResult as SuccessfulSingleTransactionPlanResult);
                break;
            }
            case 'failed': {
                failedTransactions.push(singleResult as FailedSingleTransactionPlanResult);
                break;
            }
            case 'canceled': {
                canceledTransactions.push(singleResult as CanceledSingleTransactionPlanResult);
                break;
            }
        }
    }

    return Object.freeze({
        canceledTransactions,
        failedTransactions,
        successful: failedTransactions.length === 0 && canceledTransactions.length === 0,
        successfulTransactions,
    });
}
