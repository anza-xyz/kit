import {
    SOLANA_ERROR__INSTRUCTION_PLANS__EXPECTED_SUCCESSFUL_TRANSACTION_PLAN_RESULT,
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND,
    SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT,
    SolanaError,
} from '@solana/errors';
import { Signature } from '@solana/keys';
import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
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
 * @template TContext - The type of the context object that may be passed along with results
 * @template TTransactionMessage - The type of the transaction message
 * @template TSingle - The type of single transaction plan results in this tree
 *
 * @see {@link SingleTransactionPlanResult}
 * @see {@link ParallelTransactionPlanResult}
 * @see {@link SequentialTransactionPlanResult}
 */
export type TransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
> =
    | ParallelTransactionPlanResult<TContext, TTransactionMessage, TSingle>
    | SequentialTransactionPlanResult<TContext, TTransactionMessage, TSingle>
    | TSingle;

/**
 * A {@link TransactionPlanResult} where all single transaction results are successful.
 *
 * This type represents a transaction plan result tree where every
 * {@link SingleTransactionPlanResult} has a 'successful' status. It can be used
 * to ensure that an entire execution completed without any failures or cancellations.
 *
 * Note: This is different from {@link SuccessfulSingleTransactionPlanResult} which
 * represents a single successful transaction, whereas this type represents an entire
 * plan result tree (which may contain parallel/sequential structures) where all
 * leaf nodes are successful.
 *
 * @template TContext - The type of the context object that may be passed along with results
 * @template TTransactionMessage - The type of the transaction message
 *
 * @see {@link isSuccessfulTransactionPlanResult}
 * @see {@link assertIsSuccessfulTransactionPlanResult}
 * @see {@link SuccessfulSingleTransactionPlanResult}
 */
export type SuccessfulTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
> = TransactionPlanResult<
    TContext,
    TTransactionMessage,
    SuccessfulSingleTransactionPlanResult<TContext, TTransactionMessage>
>;

/**
 * The context object associated with a {@link SingleTransactionPlanResult}.
 *
 * This type defines the shape of custom context that can be attached to
 * transaction plan results. It allows arbitrary additional properties that
 * consumers can use to pass along extra data with their results.
 *
 * Note that base context fields such as `message`, `signature`, and
 * `transaction` are provided separately by {@link BaseTransactionPlanResultContext}
 * and {@link SuccessfulBaseTransactionPlanResultContext}, which are intersected
 * with this type in each {@link SingleTransactionPlanResult} variant.
 *
 * @see {@link SingleTransactionPlanResult}
 * @see {@link SuccessfulSingleTransactionPlanResult}
 * @see {@link FailedSingleTransactionPlanResult}
 * @see {@link CanceledSingleTransactionPlanResult}
 */
export type TransactionPlanResultContext = { [key: number | string | symbol]: unknown };

/**
 * The base context fields that are common to all {@link SingleTransactionPlanResult} variants.
 *
 * This type provides optional fields for the transaction message, signature, and
 * full transaction object. These fields may or may not be populated depending on
 * how far execution progressed before the result was produced.
 *
 * @see {@link FailedSingleTransactionPlanResult}
 * @see {@link CanceledSingleTransactionPlanResult}
 * @see {@link SuccessfulBaseTransactionPlanResultContext}
 */
export interface BaseTransactionPlanResultContext {
    message?: TransactionMessage & TransactionMessageWithFeePayer;
    signature?: Signature;
    transaction?: Transaction;
}

/**
 * The base context fields for a {@link SuccessfulSingleTransactionPlanResult}.
 *
 * This extends the base context by requiring a {@link Signature}, since a
 * successful transaction always produces one. The transaction message and full
 * transaction object remain optional.
 *
 * @see {@link SuccessfulSingleTransactionPlanResult}
 * @see {@link BaseTransactionPlanResultContext}
 */
export interface SuccessfulBaseTransactionPlanResultContext extends BaseTransactionPlanResultContext {
    signature: Signature;
}

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
 * @template TContext - The type of the context object that may be passed along with results
 * @template TTransactionMessage - The type of the transaction message
 * @template TSingle - The type of single transaction plan results in this tree
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
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
> = Readonly<{
    divisible: boolean;
    kind: 'sequential';
    plans: TransactionPlanResult<TContext, TTransactionMessage, TSingle>[];
}>;

/**
 * A result for a parallel transaction plan.
 *
 * This represents the execution result of a {@link ParallelTransactionPlan} and
 * contains child results that were executed in parallel.
 *
 * You may use the {@link parallelTransactionPlanResult} helper to create objects of this type.
 *
 * @template TContext - The type of the context object that may be passed along with results
 * @template TTransactionMessage - The type of the transaction message
 * @template TSingle - The type of single transaction plan results in this tree
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
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
> = Readonly<{
    kind: 'parallel';
    plans: TransactionPlanResult<TContext, TTransactionMessage, TSingle>[];
}>;

/**
 * A result for a single transaction plan.
 *
 * This represents the execution result of a {@link SingleTransactionPlan} and
 * contains the original transaction message along with its execution status.
 *
 * You may use the {@link successfulSingleTransactionPlanResultFromTransaction},
 * {@link failedSingleTransactionPlanResult}, or {@link canceledSingleTransactionPlanResult}
 * helpers to create objects of this type.
 *
 * @template TContext - The type of the context object that may be passed along with results
 * @template TTransactionMessage - The type of the transaction message
 *
 * @example
 * Successful result with a transaction and context.
 * ```ts
 * const result = successfulSingleTransactionPlanResultFromTransaction(
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
 * @see {@link successfulSingleTransactionPlanResultFromTransaction}
 * @see {@link failedSingleTransactionPlanResult}
 * @see {@link canceledSingleTransactionPlanResult}
 */
export type SingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
> =
    | CanceledSingleTransactionPlanResult<TContext, TTransactionMessage>
    | FailedSingleTransactionPlanResult<TContext, TTransactionMessage>
    | SuccessfulSingleTransactionPlanResult<TContext, TTransactionMessage>;

/**
 * A {@link SingleTransactionPlanResult} with a 'successful' status.
 *
 * This type represents a single transaction that was successfully executed.
 * It includes the original planned message and a context object containing
 * the fields from {@link SuccessfulBaseTransactionPlanResultContext} — namely
 * a required transaction {@link Signature}, and optionally the
 * {@link TransactionMessage} and the full {@link Transaction} object.
 *
 * You may use the {@link successfulSingleTransactionPlanResultFromTransaction} or
 * {@link successfulSingleTransactionPlanResult} helpers to
 * create objects of this type.
 *
 * @template TContext - The type of the context object that may be passed along with the result.
 * @template TTransactionMessage - The type of the transaction message.
 *
 * @example
 * Creating a successful result from a transaction.
 * ```ts
 * const result = successfulSingleTransactionPlanResultFromTransaction(
 *   transactionMessage,
 *   transaction,
 * );
 * result satisfies SuccessfulSingleTransactionPlanResult;
 * result.context.signature; // The transaction signature.
 * ```
 *
 * @see {@link successfulSingleTransactionPlanResultFromTransaction}
 * @see {@link successfulSingleTransactionPlanResult}
 * @see {@link isSuccessfulSingleTransactionPlanResult}
 * @see {@link assertIsSuccessfulSingleTransactionPlanResult}
 */
export type SuccessfulSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
> = {
    context: Readonly<SuccessfulBaseTransactionPlanResultContext & TContext>;
    kind: 'single';
    plannedMessage: TTransactionMessage;
    status: 'successful';
};

/**
 * A {@link SingleTransactionPlanResult} with a 'failed' status.
 *
 * This type represents a single transaction that failed during execution.
 * It includes the original planned message, the {@link Error} that caused
 * the failure, and a context object containing the fields from
 * {@link BaseTransactionPlanResultContext} — namely optional
 * {@link TransactionMessage}, {@link Signature}, and {@link Transaction}
 * fields that may or may not be populated depending on how far execution
 * progressed before the failure.
 *
 * You may use the {@link failedSingleTransactionPlanResult} helper to
 * create objects of this type.
 *
 * @template TContext - The type of the context object that may be passed along with the result.
 * @template TTransactionMessage - The type of the transaction message.
 *
 * @example
 * Creating a failed result from a transaction message and error.
 * ```ts
 * const result = failedSingleTransactionPlanResult(
 *   transactionMessage,
 *   new Error('Transaction simulation failed'),
 * );
 * result satisfies FailedSingleTransactionPlanResult;
 * result.error; // The error that caused the failure.
 * ```
 *
 * @see {@link failedSingleTransactionPlanResult}
 * @see {@link isFailedSingleTransactionPlanResult}
 * @see {@link assertIsFailedSingleTransactionPlanResult}
 */
export type FailedSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
> = {
    context: Readonly<BaseTransactionPlanResultContext & TContext>;
    error: Error;
    kind: 'single';
    plannedMessage: TTransactionMessage;
    status: 'failed';
};

/**
 * A {@link SingleTransactionPlanResult} with a 'canceled' status.
 *
 * This type represents a single transaction whose execution was canceled
 * before it could complete. It includes the original planned message and
 * a context object containing the fields from
 * {@link BaseTransactionPlanResultContext} — namely optional
 * {@link TransactionMessage}, {@link Signature}, and {@link Transaction}
 * fields that may or may not be populated depending on how far execution
 * progressed before cancellation.
 *
 * You may use the {@link canceledSingleTransactionPlanResult} helper to
 * create objects of this type.
 *
 * @template TContext - The type of the context object that may be passed along with the result.
 * @template TTransactionMessage - The type of the transaction message.
 *
 * @example
 * Creating a canceled result from a transaction message.
 * ```ts
 * const result = canceledSingleTransactionPlanResult(transactionMessage);
 * result satisfies CanceledSingleTransactionPlanResult;
 * ```
 *
 * @see {@link canceledSingleTransactionPlanResult}
 * @see {@link isCanceledSingleTransactionPlanResult}
 * @see {@link assertIsCanceledSingleTransactionPlanResult}
 */
export type CanceledSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
> = {
    context: Readonly<BaseTransactionPlanResultContext & TContext>;
    kind: 'single';
    plannedMessage: TTransactionMessage;
    status: 'canceled';
};

/**
 * Creates a divisible {@link SequentialTransactionPlanResult} from an array of nested results.
 *
 * This function creates a sequential result with the `divisible` property set to `true`,
 * indicating that the nested plans were executed sequentially but could have been
 * split into separate transactions or batches.
 *
 * @template TContext - The type of the context object that may be passed along with results
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
 * @template TContext - The type of the context object that may be passed along with results
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
 * @template TContext - The type of the context object that may be passed along with results
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
 * @param plannedMessage - The original transaction message
 * @param transaction - The successfully executed transaction
 * @param context - Optional context object to be included with the result
 *
 * @example
 * ```ts
 * const result = successfulSingleTransactionPlanResultFromTransaction(
 *   transactionMessage,
 *   transaction
 * );
 * result satisfies SingleTransactionPlanResult;
 * ```
 *
 * @see {@link SingleTransactionPlanResult}
 */
export function successfulSingleTransactionPlanResultFromTransaction<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plannedMessage: TTransactionMessage,
    transaction: Transaction,
    context?: Omit<BaseTransactionPlanResultContext, 'signature' | 'transaction'> & TContext,
): SuccessfulSingleTransactionPlanResult<TContext, TTransactionMessage> {
    const signature = getSignatureFromTransaction(transaction);
    return Object.freeze({
        context: Object.freeze({ ...((context ?? {}) as TContext), signature, transaction }),
        kind: 'single',
        plannedMessage,
        status: 'successful',
    });
}

/**
 * Creates a successful {@link SingleTransactionPlanResult} from a transaction message and context.
 *
 * This function creates a single result with a 'successful' status, indicating that
 * the transaction was successfully executed. It also includes the original transaction
 * message and a context object that must contain at least a {@link Signature}.
 *
 * @template TContext - The type of the context object
 * @template TTransactionMessage - The type of the transaction message
 * @param plannedMessage - The original transaction message
 * @param context - Context object to be included with the result, must include a `signature` property
 *
 * @example
 * ```ts
 * const result = successfulSingleTransactionPlanResult(
 *   transactionMessage,
 *   { signature },
 * );
 * result satisfies SingleTransactionPlanResult;
 * ```
 *
 * @see {@link SingleTransactionPlanResult}
 */
export function successfulSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plannedMessage: TTransactionMessage,
    context: SuccessfulBaseTransactionPlanResultContext & TContext,
): SuccessfulSingleTransactionPlanResult<TContext, TTransactionMessage> {
    return Object.freeze({
        context: Object.freeze({ ...context }),
        kind: 'single',
        plannedMessage,
        status: 'successful',
    });
}

/**
 * Creates a failed {@link SingleTransactionPlanResult} from a transaction message and error.
 *
 * This function creates a single result with a 'failed' status, indicating that
 * the transaction execution failed. It includes the original transaction message
 * and the error that caused the failure.
 *
 * @template TContext - The type of the context object
 * @template TTransactionMessage - The type of the transaction message
 * @param plannedMessage - The original transaction message
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
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plannedMessage: TTransactionMessage,
    error: Error,
    context?: TContext,
): FailedSingleTransactionPlanResult<TContext, TTransactionMessage> {
    return Object.freeze({
        context: Object.freeze({ ...((context ?? {}) as TContext) }),
        error,
        kind: 'single',
        plannedMessage,
        status: 'failed',
    });
}

/**
 * Creates a canceled {@link SingleTransactionPlanResult} from a transaction message.
 *
 * This function creates a single result with a 'canceled' status, indicating that
 * the transaction execution was canceled. It includes the original transaction message.
 *
 * @template TContext - The type of the context object
 * @template TTransactionMessage - The type of the transaction message
 * @param plannedMessage - The original transaction message
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
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plannedMessage: TTransactionMessage,
    context?: TContext,
): CanceledSingleTransactionPlanResult<TContext, TTransactionMessage> {
    return Object.freeze({
        context: Object.freeze({ ...((context ?? {}) as TContext) }),
        kind: 'single',
        plannedMessage,
        status: 'canceled',
    });
}

/**
 * Checks if the given transaction plan result is a {@link SingleTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to check.
 * @return `true` if the result is a single transaction plan result, `false` otherwise.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = successfulSingleTransactionPlanResultFromTransaction(message, transaction);
 *
 * if (isSingleTransactionPlanResult(result)) {
 *   console.log(result.status); // TypeScript knows this is a SingleTransactionPlanResult.
 * }
 * ```
 *
 * @see {@link SingleTransactionPlanResult}
 * @see {@link assertIsSingleTransactionPlanResult}
 */
export function isSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(plan: TransactionPlanResult<TContext, TTransactionMessage, TSingle>): plan is TSingle {
    return plan.kind === 'single';
}

/**
 * Asserts that the given transaction plan result is a {@link SingleTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT` if the result is not a single transaction plan result.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = successfulSingleTransactionPlanResultFromTransaction(message, transaction);
 *
 * assertIsSingleTransactionPlanResult(result);
 * console.log(result.status); // TypeScript knows this is a SingleTransactionPlanResult.
 * ```
 *
 * @see {@link SingleTransactionPlanResult}
 * @see {@link isSingleTransactionPlanResult}
 */
export function assertIsSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(plan: TransactionPlanResult<TContext, TTransactionMessage, TSingle>): asserts plan is TSingle {
    if (!isSingleTransactionPlanResult(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT, {
            actualKind: plan.kind,
            expectedKind: 'single',
            transactionPlanResult: plan,
        });
    }
}

/**
 * Checks if the given transaction plan result is a successful {@link SingleTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to check.
 * @return `true` if the result is a successful single transaction plan result, `false` otherwise.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = successfulSingleTransactionPlanResultFromTransaction(message, transaction);
 *
 * if (isSuccessfulSingleTransactionPlanResult(result)) {
 *   console.log(result.context.signature); // TypeScript knows this is a successful result.
 * }
 * ```
 *
 * @see {@link SuccessfulSingleTransactionPlanResult}
 * @see {@link assertIsSuccessfulSingleTransactionPlanResult}
 */
export function isSuccessfulSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage>,
): plan is SuccessfulSingleTransactionPlanResult<TContext, TTransactionMessage> {
    return plan.kind === 'single' && plan.status === 'successful';
}

/**
 * Asserts that the given transaction plan result is a successful {@link SingleTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT` if the result is not a successful single transaction plan result.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = successfulSingleTransactionPlanResultFromTransaction(message, transaction);
 *
 * assertIsSuccessfulSingleTransactionPlanResult(result);
 * console.log(result.context.signature); // TypeScript knows this is a successful result.
 * ```
 *
 * @see {@link SuccessfulSingleTransactionPlanResult}
 * @see {@link isSuccessfulSingleTransactionPlanResult}
 */
export function assertIsSuccessfulSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage>,
): asserts plan is SuccessfulSingleTransactionPlanResult<TContext, TTransactionMessage> {
    if (!isSuccessfulSingleTransactionPlanResult(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT, {
            actualKind: plan.kind === 'single' ? `${plan.status} single` : plan.kind,
            expectedKind: 'successful single',
            transactionPlanResult: plan,
        });
    }
}

/**
 * Checks if the given transaction plan result is a failed {@link SingleTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to check.
 * @return `true` if the result is a failed single transaction plan result, `false` otherwise.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = failedSingleTransactionPlanResult(message, error);
 *
 * if (isFailedSingleTransactionPlanResult(result)) {
 *   console.log(result.error); // TypeScript knows this is a failed result.
 * }
 * ```
 *
 * @see {@link FailedSingleTransactionPlanResult}
 * @see {@link assertIsFailedSingleTransactionPlanResult}
 */
export function isFailedSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage>,
): plan is FailedSingleTransactionPlanResult<TContext, TTransactionMessage> {
    return plan.kind === 'single' && plan.status === 'failed';
}

/**
 * Asserts that the given transaction plan result is a failed {@link SingleTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT` if the result is not a failed single transaction plan result.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = failedSingleTransactionPlanResult(message, error);
 *
 * assertIsFailedSingleTransactionPlanResult(result);
 * console.log(result.error); // TypeScript knows this is a failed result.
 * ```
 *
 * @see {@link FailedSingleTransactionPlanResult}
 * @see {@link isFailedSingleTransactionPlanResult}
 */
export function assertIsFailedSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage>,
): asserts plan is FailedSingleTransactionPlanResult<TContext, TTransactionMessage> {
    if (!isFailedSingleTransactionPlanResult(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT, {
            actualKind: plan.kind === 'single' ? `${plan.status} single` : plan.kind,
            expectedKind: 'failed single',
            transactionPlanResult: plan,
        });
    }
}

/**
 * Checks if the given transaction plan result is a canceled {@link SingleTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to check.
 * @return `true` if the result is a canceled single transaction plan result, `false` otherwise.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = canceledSingleTransactionPlanResult(message);
 *
 * if (isCanceledSingleTransactionPlanResult(result)) {
 *   console.log('Transaction was canceled'); // TypeScript knows this is a canceled result.
 * }
 * ```
 *
 * @see {@link CanceledSingleTransactionPlanResult}
 * @see {@link assertIsCanceledSingleTransactionPlanResult}
 */
export function isCanceledSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage>,
): plan is CanceledSingleTransactionPlanResult<TContext, TTransactionMessage> {
    return plan.kind === 'single' && plan.status === 'canceled';
}

/**
 * Asserts that the given transaction plan result is a canceled {@link SingleTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT` if the result is not a canceled single transaction plan result.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = canceledSingleTransactionPlanResult(message);
 *
 * assertIsCanceledSingleTransactionPlanResult(result);
 * console.log('Transaction was canceled'); // TypeScript knows this is a canceled result.
 * ```
 *
 * @see {@link CanceledSingleTransactionPlanResult}
 * @see {@link isCanceledSingleTransactionPlanResult}
 */
export function assertIsCanceledSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage>,
): asserts plan is CanceledSingleTransactionPlanResult<TContext, TTransactionMessage> {
    if (!isCanceledSingleTransactionPlanResult(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT, {
            actualKind: plan.kind === 'single' ? `${plan.status} single` : plan.kind,
            expectedKind: 'canceled single',
            transactionPlanResult: plan,
        });
    }
}

/**
 * Checks if the given transaction plan result is a {@link SequentialTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to check.
 * @return `true` if the result is a sequential transaction plan result, `false` otherwise.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = sequentialTransactionPlanResult([resultA, resultB]);
 *
 * if (isSequentialTransactionPlanResult(result)) {
 *   console.log(result.divisible); // TypeScript knows this is a SequentialTransactionPlanResult.
 * }
 * ```
 *
 * @see {@link SequentialTransactionPlanResult}
 * @see {@link assertIsSequentialTransactionPlanResult}
 */
export function isSequentialTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage, TSingle>,
): plan is SequentialTransactionPlanResult<TContext, TTransactionMessage, TSingle> {
    return plan.kind === 'sequential';
}

/**
 * Asserts that the given transaction plan result is a {@link SequentialTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT` if the result is not a sequential transaction plan result.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = sequentialTransactionPlanResult([resultA, resultB]);
 *
 * assertIsSequentialTransactionPlanResult(result);
 * console.log(result.divisible); // TypeScript knows this is a SequentialTransactionPlanResult.
 * ```
 *
 * @see {@link SequentialTransactionPlanResult}
 * @see {@link isSequentialTransactionPlanResult}
 */
export function assertIsSequentialTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage, TSingle>,
): asserts plan is SequentialTransactionPlanResult<TContext, TTransactionMessage, TSingle> {
    if (!isSequentialTransactionPlanResult(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT, {
            actualKind: plan.kind,
            expectedKind: 'sequential',
            transactionPlanResult: plan,
        });
    }
}

/**
 * Checks if the given transaction plan result is a non-divisible {@link SequentialTransactionPlanResult}.
 *
 * A non-divisible sequential result indicates that the transactions were executed
 * atomically — usually in a transaction bundle.
 *
 * @param plan - The transaction plan result to check.
 * @return `true` if the result is a non-divisible sequential transaction plan result, `false` otherwise.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = nonDivisibleSequentialTransactionPlanResult([resultA, resultB]);
 *
 * if (isNonDivisibleSequentialTransactionPlanResult(result)) {
 *   // Transactions were executed atomically.
 * }
 * ```
 *
 * @see {@link SequentialTransactionPlanResult}
 * @see {@link assertIsNonDivisibleSequentialTransactionPlanResult}
 */
export function isNonDivisibleSequentialTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage, TSingle>,
): plan is SequentialTransactionPlanResult<TContext, TTransactionMessage, TSingle> & { divisible: false } {
    return plan.kind === 'sequential' && plan.divisible === false;
}

/**
 * Asserts that the given transaction plan result is a non-divisible {@link SequentialTransactionPlanResult}.
 *
 * A non-divisible sequential result indicates that the transactions were executed
 * atomically — usually in a transaction bundle.
 *
 * @param plan - The transaction plan result to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT` if the result is not a non-divisible sequential transaction plan result.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = nonDivisibleSequentialTransactionPlanResult([resultA, resultB]);
 *
 * assertIsNonDivisibleSequentialTransactionPlanResult(result);
 * // Transactions were executed atomically.
 * ```
 *
 * @see {@link SequentialTransactionPlanResult}
 * @see {@link isNonDivisibleSequentialTransactionPlanResult}
 */
export function assertIsNonDivisibleSequentialTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage, TSingle>,
): asserts plan is SequentialTransactionPlanResult<TContext, TTransactionMessage, TSingle> & { divisible: false } {
    if (!isNonDivisibleSequentialTransactionPlanResult(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT, {
            actualKind: plan.kind === 'sequential' ? 'divisible sequential' : plan.kind,
            expectedKind: 'non-divisible sequential',
            transactionPlanResult: plan,
        });
    }
}

/**
 * Checks if the given transaction plan result is a {@link ParallelTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to check.
 * @return `true` if the result is a parallel transaction plan result, `false` otherwise.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = parallelTransactionPlanResult([resultA, resultB]);
 *
 * if (isParallelTransactionPlanResult(result)) {
 *   console.log(result.plans.length); // TypeScript knows this is a ParallelTransactionPlanResult.
 * }
 * ```
 *
 * @see {@link ParallelTransactionPlanResult}
 * @see {@link assertIsParallelTransactionPlanResult}
 */
export function isParallelTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage, TSingle>,
): plan is ParallelTransactionPlanResult<TContext, TTransactionMessage, TSingle> {
    return plan.kind === 'parallel';
}

/**
 * Asserts that the given transaction plan result is a {@link ParallelTransactionPlanResult}.
 *
 * @param plan - The transaction plan result to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT` if the result is not a parallel transaction plan result.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = parallelTransactionPlanResult([resultA, resultB]);
 *
 * assertIsParallelTransactionPlanResult(result);
 * console.log(result.plans.length); // TypeScript knows this is a ParallelTransactionPlanResult.
 * ```
 *
 * @see {@link ParallelTransactionPlanResult}
 * @see {@link isParallelTransactionPlanResult}
 */
export function assertIsParallelTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage, TSingle>,
): asserts plan is ParallelTransactionPlanResult<TContext, TTransactionMessage, TSingle> {
    if (!isParallelTransactionPlanResult(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT, {
            actualKind: plan.kind,
            expectedKind: 'parallel',
            transactionPlanResult: plan,
        });
    }
}

/**
 * Checks if the given transaction plan result is a {@link SuccessfulTransactionPlanResult}.
 *
 * This function verifies that the entire transaction plan result tree contains only
 * successful single transaction results. It recursively checks all nested results
 * to ensure every {@link SingleTransactionPlanResult} has a 'successful' status.
 *
 * Note: This is different from {@link isSuccessfulSingleTransactionPlanResult} which
 * checks if a single result is successful. This function checks that the entire
 * plan result tree (including all nested parallel/sequential structures) contains
 * only successful transactions.
 *
 * @param plan - The transaction plan result to check.
 * @return `true` if all single transaction results in the tree are successful, `false` otherwise.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = parallelTransactionPlanResult([
 *   successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
 *   successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB),
 * ]);
 *
 * if (isSuccessfulTransactionPlanResult(result)) {
 *   // All transactions were successful.
 *   result satisfies SuccessfulTransactionPlanResult;
 * }
 * ```
 *
 * @see {@link SuccessfulTransactionPlanResult}
 * @see {@link assertIsSuccessfulTransactionPlanResult}
 * @see {@link isSuccessfulSingleTransactionPlanResult}
 */
export function isSuccessfulTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage>,
): plan is SuccessfulTransactionPlanResult<TContext, TTransactionMessage> {
    return everyTransactionPlanResult(
        plan,
        r => !isSingleTransactionPlanResult(r) || isSuccessfulSingleTransactionPlanResult(r),
    );
}

/**
 * Asserts that the given transaction plan result is a {@link SuccessfulTransactionPlanResult}.
 *
 * This function verifies that the entire transaction plan result tree contains only
 * successful single transaction results. It throws if any {@link SingleTransactionPlanResult}
 * in the tree has a 'failed' or 'canceled' status.
 *
 * Note: This is different from {@link assertIsSuccessfulSingleTransactionPlanResult} which
 * asserts that a single result is successful. This function asserts that the entire
 * plan result tree (including all nested parallel/sequential structures) contains
 * only successful transactions.
 *
 * @param plan - The transaction plan result to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__EXPECTED_SUCCESSFUL_TRANSACTION_PLAN_RESULT` if
 * any single transaction result in the tree is not successful.
 *
 * @example
 * ```ts
 * const result: TransactionPlanResult = parallelTransactionPlanResult([
 *   successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
 *   successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB),
 * ]);
 *
 * assertIsSuccessfulTransactionPlanResult(result);
 * // All transactions were successful.
 * result satisfies SuccessfulTransactionPlanResult;
 * ```
 *
 * @see {@link SuccessfulTransactionPlanResult}
 * @see {@link isSuccessfulTransactionPlanResult}
 * @see {@link assertIsSuccessfulSingleTransactionPlanResult}
 */
export function assertIsSuccessfulTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    plan: TransactionPlanResult<TContext, TTransactionMessage>,
): asserts plan is SuccessfulTransactionPlanResult<TContext, TTransactionMessage> {
    if (!isSuccessfulTransactionPlanResult(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__EXPECTED_SUCCESSFUL_TRANSACTION_PLAN_RESULT, {
            transactionPlanResult: plan,
        });
    }
}

/**
 * Finds the first transaction plan result in the tree that matches the given predicate.
 *
 * This function performs a depth-first search through the transaction plan result tree,
 * returning the first result that satisfies the predicate. It checks the root result
 * first, then recursively searches through nested results.
 *
 * @template TContext - The type of the context object that may be passed along with results
 * @template TTransactionMessage - The type of the transaction message
 * @template TSingle - The type of single transaction plan results in this tree
 * @param transactionPlanResult - The transaction plan result tree to search.
 * @param predicate - A function that returns `true` for the result to find.
 * @returns The first matching transaction plan result, or `undefined` if no match is found.
 *
 * @example
 * Finding a failed transaction result.
 * ```ts
 * const result = parallelTransactionPlanResult([
 *   successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
 *   failedSingleTransactionPlanResult(messageB, error),
 * ]);
 *
 * const failed = findTransactionPlanResult(
 *   result,
 *   (r) => r.kind === 'single' && r.status === 'failed',
 * );
 * // Returns the failed single transaction plan result for messageB.
 * ```
 *
 * @see {@link TransactionPlanResult}
 * @see {@link everyTransactionPlanResult}
 * @see {@link transformTransactionPlanResult}
 * @see {@link flattenTransactionPlanResult}
 */
export function findTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(
    transactionPlanResult: TransactionPlanResult<TContext, TTransactionMessage, TSingle>,
    predicate: (result: TransactionPlanResult<TContext, TTransactionMessage, TSingle>) => boolean,
): TransactionPlanResult<TContext, TTransactionMessage, TSingle> | undefined {
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
 * @template TContext - The type of the context object that may be passed along with results
 * @template TTransactionMessage - The type of the transaction message
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
 *   successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
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
export function getFirstFailedSingleTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    transactionPlanResult: TransactionPlanResult<TContext, TTransactionMessage>,
): FailedSingleTransactionPlanResult<TContext, TTransactionMessage> {
    const result = findTransactionPlanResult(transactionPlanResult, r => r.kind === 'single' && r.status === 'failed');

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

    return result as FailedSingleTransactionPlanResult<TContext, TTransactionMessage>;
}

/**
 * Checks if every transaction plan result in the tree satisfies the given predicate.
 *
 * This function performs a depth-first traversal through the transaction plan result tree,
 * returning `true` only if the predicate returns `true` for every result in the tree
 * (including the root result and all nested results).
 *
 * @template TContext - The type of the context object that may be passed along with results
 * @template TTransactionMessage - The type of the transaction message
 * @template TSingle - The type of single transaction plan results in this tree
 * @param transactionPlanResult - The transaction plan result tree to check.
 * @param predicate - A function that returns `true` if the result satisfies the condition.
 * @return `true` if every result in the tree satisfies the predicate, `false` otherwise.
 *
 * @example
 * Checking if all transactions were successful.
 * ```ts
 * const result = parallelTransactionPlanResult([
 *   successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
 *   successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB),
 * ]);
 *
 * const allSuccessful = everyTransactionPlanResult(
 *   result,
 *   (r) => r.kind !== 'single' || r.status === 'successful',
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
 *   (r) => r.kind !== 'single' || r.status !== 'canceled',
 * );
 * ```
 *
 * @see {@link TransactionPlanResult}
 * @see {@link findTransactionPlanResult}
 * @see {@link transformTransactionPlanResult}
 * @see {@link flattenTransactionPlanResult}
 */
export function everyTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(
    transactionPlanResult: TransactionPlanResult<TContext, TTransactionMessage, TSingle>,
    predicate: (plan: TransactionPlanResult<TContext, TTransactionMessage, TSingle>) => boolean,
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
 *   successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
 *   canceledSingleTransactionPlanResult(messageB),
 * ]);
 *
 * const transformed = transformTransactionPlanResult(result, (r) => {
 *   if (r.kind === 'single' && r.status === 'canceled') {
 *     return failedSingleTransactionPlanResult(r.plannedMessage, new Error('Execution canceled'));
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
 * @template TContext - The type of the context object that may be passed along with results
 * @template TTransactionMessage - The type of the transaction message
 * @template TSingle - The type of single transaction plan results in this tree
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
export function flattenTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
    TSingle extends SingleTransactionPlanResult<TContext, TTransactionMessage> = SingleTransactionPlanResult<
        TContext,
        TTransactionMessage
    >,
>(result: TransactionPlanResult<TContext, TTransactionMessage, TSingle>): TSingle[] {
    if (result.kind === 'single') {
        return [result];
    }
    return result.plans.flatMap(flattenTransactionPlanResult);
}

/**
 * A summary of a {@link TransactionPlanResult}, categorizing transactions by their execution status.
 * - `successful`: Indicates whether all transactions were successful (i.e., no failed or canceled transactions).
 * - `successfulTransactions`: An array of successful transactions, each including its signature.
 * - `failedTransactions`: An array of failed transactions, each including the error that caused the failure.
 * - `canceledTransactions`: An array of canceled transactions.
 */
export type TransactionPlanResultSummary<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
> = Readonly<{
    canceledTransactions: CanceledSingleTransactionPlanResult<TContext, TTransactionMessage>[];
    failedTransactions: FailedSingleTransactionPlanResult<TContext, TTransactionMessage>[];
    successful: boolean;
    successfulTransactions: SuccessfulSingleTransactionPlanResult<TContext, TTransactionMessage>[];
}>;

/**
 * Summarize a {@link TransactionPlanResult} into a {@link TransactionPlanResultSummary}.
 *
 * @template TContext - The type of the context object that may be passed along with results
 * @template TTransactionMessage - The type of the transaction message
 * @param result The transaction plan result to summarize
 * @returns A summary of the transaction plan result
 */
export function summarizeTransactionPlanResult<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(
    result: TransactionPlanResult<TContext, TTransactionMessage>,
): TransactionPlanResultSummary<TContext, TTransactionMessage> {
    type Out = TransactionPlanResultSummary<TContext, TTransactionMessage>;
    const successfulTransactions: Out['successfulTransactions'] = [];
    const failedTransactions: Out['failedTransactions'] = [];
    const canceledTransactions: Out['canceledTransactions'] = [];

    const flattenedResults = flattenTransactionPlanResult(result);

    for (const singleResult of flattenedResults) {
        switch (singleResult.status) {
            case 'successful': {
                successfulTransactions.push(singleResult);
                break;
            }
            case 'failed': {
                failedTransactions.push(singleResult);
                break;
            }
            case 'canceled': {
                canceledTransactions.push(singleResult);
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
