import { SolanaError } from '@solana/errors';
import { BaseTransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
import { Transaction } from '@solana/transactions';

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
    | Readonly<{ context: TContext; kind: 'successful'; transaction: Transaction }>
    | Readonly<{ error: SolanaError; kind: 'failed' }>
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
        status: Object.freeze({ context: context ?? ({} as TContext), kind: 'successful', transaction }),
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
>(
    transactionMessage: TTransactionMessage,
    error: SolanaError,
): SingleTransactionPlanResult<TContext, TTransactionMessage> {
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
