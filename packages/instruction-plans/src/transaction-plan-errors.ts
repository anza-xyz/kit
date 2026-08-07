import {
    isSolanaError,
    type RpcSimulateTransactionResult,
    SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION,
    SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS,
    SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTION,
    SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTIONS,
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
    SolanaError,
    type SolanaErrorCode,
} from '@solana/errors';

import {
    type CanceledSingleTransactionPlanResult,
    type FailedSingleTransactionPlanResult,
    flattenTransactionPlanResult,
    type TransactionPlanResult,
    type TransactionPlanResultContext,
    type TransactionPlanResultContextWithSignature,
} from './transaction-plan-result';

type PreflightData = Omit<RpcSimulateTransactionResult, 'err'>;

/**
 * Creates a {@link SolanaError} with the {@link SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION}
 * error code from a failed or canceled {@link SingleTransactionPlanResult}.
 *
 * This is a high-level error designed for user-facing transaction send failures.
 * It unwraps simulation errors (such as preflight failures) to expose the
 * underlying transaction error as the `cause`, and extracts preflight data
 * and logs into the error context for easy access.
 *
 * The error message includes an indicator showing whether the failure was a
 * preflight error or includes the on-chain transaction signature for easy
 * copy-pasting into block explorers.
 *
 * @typeParam TContext - The type of the context object attached to the result. Any context is
 * accepted; the signature is read from it only if one happens to be there.
 * @param result - A failed or canceled single transaction plan result.
 * @param abortReason - An optional abort reason if the transaction was canceled.
 * @return A {@link SolanaError} with the appropriate error code, context, and cause.
 *
 * @example
 * Creating an error from a failed transaction plan result.
 * ```ts
 * import { createFailedToSendTransactionError } from '@solana/instruction-plans';
 *
 * const error = createFailedToSendTransactionError(failedResult);
 * console.log(error.message);
 * // "Failed to send transaction (preflight): Insufficient funds for fee"
 * console.log(error.cause);
 * // The unwrapped transaction error
 * console.log(error.context.logs);
 * // Transaction logs from the preflight simulation
 * ```
 *
 * @see {@link createFailedToSendTransactionsError}
 * @see {@link createFailedToSignTransactionError}
 */
export function createFailedToSendTransactionError<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(
    result: CanceledSingleTransactionPlanResult<TContext> | FailedSingleTransactionPlanResult<TContext>,
    abortReason?: unknown,
): SolanaError<typeof SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION> {
    return new SolanaError(
        SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION,
        getSingleFailureContext(result, abortReason, true /* includeSubmissionIndicator */),
    );
}

/**
 * Creates a {@link SolanaError} with the {@link SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTION}
 * error code from a failed or canceled {@link SingleTransactionPlanResult}.
 *
 * This is the signing counterpart to {@link createFailedToSendTransactionError}, designed
 * for user-facing failures raised by executors that sign a transaction without submitting
 * it. It behaves identically — unwrapping simulation errors to expose the underlying
 * transaction error as the `cause`, and extracting preflight data and logs into the error
 * context — because signing executors typically estimate resource limits by simulating
 * before they sign.
 *
 * Unlike the sending variant, the message carries no indicator of where the failure
 * happened. That indicator locates a failure relative to network submission — `(preflight)`
 * before it, or the transaction signature after it — and signing never submits, so neither
 * applies. The `logs` and `preflightData` context properties are still populated whenever a
 * simulation was responsible, and those logs still appear in the message, so nothing is lost
 * beyond the prefix.
 *
 * @typeParam TContext - The type of the context object attached to the result. Any context is
 * accepted, since this helper never reads from it.
 * @param result - A failed or canceled single transaction plan result.
 * @param abortReason - An optional abort reason if the transaction was canceled.
 * @return A {@link SolanaError} with the appropriate error code, context, and cause.
 *
 * @example
 * Creating an error from a failed transaction plan result.
 * ```ts
 * import { createFailedToSignTransactionError } from '@solana/instruction-plans';
 *
 * const error = createFailedToSignTransactionError(failedResult);
 * console.log(error.message);
 * // "Failed to sign transaction: The user rejected the signing request"
 * console.log(error.cause);
 * // The unwrapped signing error
 * ```
 *
 * @see {@link createFailedToSignTransactionsError}
 * @see {@link createFailedToSendTransactionError}
 */
export function createFailedToSignTransactionError<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
>(
    result: CanceledSingleTransactionPlanResult<TContext> | FailedSingleTransactionPlanResult<TContext>,
    abortReason?: unknown,
): SolanaError<typeof SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTION> {
    return new SolanaError(
        SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTION,
        getSingleFailureContext(result, abortReason, false /* includeSubmissionIndicator */),
    );
}

/**
 * Creates a {@link SolanaError} with the {@link SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS}
 * error code from a {@link TransactionPlanResult}.
 *
 * This is a high-level error designed for user-facing transaction send failures
 * involving multiple transactions. It walks the result tree, unwraps simulation
 * errors from each failure, and builds a `failedTransactions` array pairing each
 * failure with its unwrapped error, logs, and preflight data.
 *
 * The error message lists each failure with its position in the plan and an
 * indicator showing whether it was a preflight error or includes the transaction
 * signature. When all transactions were canceled, the message is a single line.
 *
 * @typeParam TContext - The type of the context object attached to the results. Any context is
 * accepted; each signature is read from it only if one happens to be there.
 * @param result - The full transaction plan result tree.
 * @param abortReason - An optional abort reason if the plan was aborted.
 * @return A {@link SolanaError} with the appropriate error code, context, and cause.
 *
 * @example
 * Creating an error from a failed transaction plan result.
 * ```ts
 * import { createFailedToSendTransactionsError } from '@solana/instruction-plans';
 *
 * const error = createFailedToSendTransactionsError(planResult);
 * console.log(error.message);
 * // "Failed to send transactions.
 * // [Tx #1 (preflight)] Insufficient funds for fee
 * // [Tx #3 (5abc...)] Custom program error: 0x1"
 * console.log(error.context.failedTransactions);
 * // [{ index: 0, error: ..., logs: [...], preflightData: {...} }, ...]
 * ```
 *
 * @see {@link createFailedToSendTransactionError}
 * @see {@link createFailedToSignTransactionsError}
 */
export function createFailedToSendTransactionsError<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(
    result: TransactionPlanResult<TContext>,
    abortReason?: unknown,
): SolanaError<typeof SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS> {
    return new SolanaError(
        SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS,
        getMultipleFailuresContext(result, abortReason, true /* includeSubmissionIndicator */),
    );
}

/**
 * Creates a {@link SolanaError} with the {@link SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTIONS}
 * error code from a {@link TransactionPlanResult}.
 *
 * This is the signing counterpart to {@link createFailedToSendTransactionsError}, designed
 * for user-facing failures raised by executors that sign several transactions without
 * submitting them. It walks the result tree, unwraps simulation errors from each failure,
 * and builds the same `failedTransactions` array pairing each failure with its unwrapped
 * error, logs, and preflight data.
 *
 * As with {@link createFailedToSignTransactionError}, each line names only the position of
 * the failure in the plan. Nothing was submitted, so there is no preflight to flag and no
 * transaction signature worth quoting.
 *
 * @typeParam TContext - The type of the context object attached to the results. Any context is
 * accepted, since this helper never reads from it.
 * @param result - The full transaction plan result tree.
 * @param abortReason - An optional abort reason if the plan was aborted.
 * @return A {@link SolanaError} with the appropriate error code, context, and cause.
 *
 * @example
 * Creating an error from a failed transaction plan result.
 * ```ts
 * import { createFailedToSignTransactionsError } from '@solana/instruction-plans';
 *
 * const error = createFailedToSignTransactionsError(planResult);
 * console.log(error.message);
 * // "Failed to sign transactions.
 * // [Tx #1] Insufficient funds for fee
 * // [Tx #3] The user rejected the signing request"
 * console.log(error.context.failedTransactions);
 * // [{ index: 0, error: ..., logs: [...], preflightData: {...} }, ...]
 * ```
 *
 * @see {@link createFailedToSignTransactionError}
 * @see {@link createFailedToSendTransactionsError}
 */
export function createFailedToSignTransactionsError<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
>(
    result: TransactionPlanResult<TContext>,
    abortReason?: unknown,
): SolanaError<typeof SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTIONS> {
    return new SolanaError(
        SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTIONS,
        getMultipleFailuresContext(result, abortReason, false /* includeSubmissionIndicator */),
    );
}

/**
 * Builds the shared error context for the singular failed-to-send and failed-to-sign errors.
 *
 * @param includeSubmissionIndicator - Whether the message should indicate where the failure
 * occurred relative to network submission: `(preflight)` before it, or the transaction
 * signature after it. Signing never submits, so neither is meaningful there.
 */
function getSingleFailureContext<TContext extends TransactionPlanResultContext>(
    result: CanceledSingleTransactionPlanResult<TContext> | FailedSingleTransactionPlanResult<TContext>,
    abortReason: unknown,
    includeSubmissionIndicator: boolean,
): Record<string, unknown> {
    let causeMessage: string;
    let cause: unknown;
    let logs: readonly string[] | undefined;
    let preflightData: PreflightData | undefined;

    if (result.status === 'failed') {
        const unwrapped = unwrapErrorWithPreflightData(result.error);
        logs = unwrapped.logs;
        preflightData = unwrapped.preflightData;
        cause = unwrapped.unwrappedError;
        const indicator = includeSubmissionIndicator
            ? getFailedIndicator(!!preflightData, getSignatureFromContext(result.context))
            : '';
        causeMessage = `${indicator}: ${(cause as Error).message}${formatLogSnippet(logs)}`;
    } else {
        cause = abortReason;
        causeMessage = abortReason != null ? `. Canceled with abort reason: ${String(abortReason)}` : ': Canceled';
    }

    const context: Record<string, unknown> = {
        cause,
        causeMessage,
        logs,
        preflightData,
    };
    Object.defineProperty(context, 'transactionPlanResult', {
        configurable: false,
        enumerable: false,
        value: result,
        writable: false,
    });
    return context;
}

/**
 * Builds the shared error context for the plural failed-to-send and failed-to-sign errors.
 *
 * @param includeSubmissionIndicator - Whether each line should indicate where that failure
 * occurred relative to network submission: `(preflight)` before it, or the transaction
 * signature after it. Signing never submits, so neither is meaningful there.
 */
function getMultipleFailuresContext<TContext extends TransactionPlanResultContext>(
    result: TransactionPlanResult<TContext>,
    abortReason: unknown,
    includeSubmissionIndicator: boolean,
): Record<string, unknown> {
    const flattenedResults = flattenTransactionPlanResult(result);

    const failedTransactions = flattenedResults.flatMap((singleResult, index) => {
        if (singleResult.status !== 'failed') return [];
        const unwrapped = unwrapErrorWithPreflightData(singleResult.error);
        return [
            {
                error: unwrapped.unwrappedError as Error,
                index,
                logs: unwrapped.logs,
                preflightData: unwrapped.preflightData,
            },
        ];
    });

    let causeMessages: string;
    let cause: unknown;

    if (failedTransactions.length > 0) {
        cause = failedTransactions.length === 1 ? failedTransactions[0].error : undefined;
        const failureLines = failedTransactions.map(({ error, index, preflightData }) => {
            const indicator = includeSubmissionIndicator
                ? getFailedIndicator(!!preflightData, getSignatureFromContext(flattenedResults[index].context))
                : '';
            return `\n[Tx #${index + 1}${indicator}] ${error.message}`;
        });
        const logSnippet = failedTransactions.length === 1 ? formatLogSnippet(failedTransactions[0].logs) : '';
        causeMessages = `.${failureLines.join('')}${logSnippet}${logSnippet ? '' : '\n'}`;
    } else {
        cause = abortReason;
        causeMessages = abortReason != null ? `. Canceled with abort reason: ${String(abortReason)}` : ': Canceled';
    }

    const context: Record<string, unknown> = {
        cause,
        causeMessages,
        failedTransactions,
    };
    Object.defineProperty(context, 'transactionPlanResult', {
        configurable: false,
        enumerable: false,
        value: result,
        writable: false,
    });
    return context;
}

/**
 * Creates a {@link SolanaError} with the
 * {@link SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN}
 * error code from a {@link TransactionPlanResult}.
 *
 * This is a low-level error intended for custom transaction plan executor
 * authors. It attaches the full `transactionPlanResult` as a non-enumerable
 * property so that callers can inspect execution details without the result
 * being serialized with the error.
 *
 * @typeParam TContext - The type of the context object attached to the results. Any context is
 * accepted, since this helper never reads from it.
 * @param result - The full transaction plan result tree.
 * @param abortReason - An optional abort reason if the plan was aborted.
 * @return A {@link SolanaError} with the appropriate error code and context.
 *
 * @example
 * Throwing a failed-to-execute error from a custom executor.
 * ```ts
 * import { createFailedToExecuteTransactionPlanError } from '@solana/instruction-plans';
 *
 * throw createFailedToExecuteTransactionPlanError(transactionPlanResult, abortSignal?.reason);
 * ```
 *
 * @see {@link createFailedToSendTransactionError}
 * @see {@link createFailedToSendTransactionsError}
 */
export function createFailedToExecuteTransactionPlanError<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(
    result: TransactionPlanResult<TContext>,
    abortReason?: unknown,
): SolanaError<typeof SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN> {
    const context: Record<string, unknown> = {
        abortReason,
        // Deprecated: will be removed in a future version.
        cause: findErrorFromTransactionPlanResult(result) ?? abortReason,
    };
    Object.defineProperty(context, 'transactionPlanResult', {
        configurable: false,
        enumerable: false,
        value: result,
        writable: false,
    });
    return new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, context);
}

function unwrapErrorWithPreflightData(error: Error): {
    logs: readonly string[] | undefined;
    preflightData: PreflightData | undefined;
    unwrappedError: unknown;
} {
    const simulationCodes: SolanaErrorCode[] = [
        SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
        SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
    ];
    if (isSolanaError(error) && simulationCodes.includes(error.context.__code)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { __code, ...preflightData } = error.context;
        return {
            logs: (preflightData as PreflightData).logs ?? undefined,
            preflightData: preflightData as PreflightData,
            unwrappedError: error.cause ?? error,
        };
    }
    return { logs: undefined, preflightData: undefined, unwrappedError: error };
}

function findErrorFromTransactionPlanResult<TContext extends TransactionPlanResultContext>(
    result: TransactionPlanResult<TContext>,
): Error | undefined {
    if (result.kind === 'single') {
        return result.status === 'failed' ? result.error : undefined;
    }
    for (const plan of result.plans) {
        const error = findErrorFromTransactionPlanResult(plan);
        if (error) {
            return error;
        }
    }
}

function formatLogSnippet(logs: readonly string[] | undefined): string {
    if (!logs || logs.length === 0) return '';
    const maxLines = 8;
    const lastLines = logs.slice(-maxLines);
    const header = logs.length > maxLines ? `\n\nLogs (last ${maxLines} of ${logs.length}):` : '\n\nLogs:';
    return `${header}\n${lastLines.map(line => `  > ${line}\n`).join('')}`;
}

/**
 * Reads a signature out of an arbitrary result context.
 *
 * Nothing guarantees that a context has a signature — an executor may produce results for
 * transactions it never submitted — so this narrows at runtime rather than trusting the type.
 */
function getSignatureFromContext(context: TransactionPlanResultContext): string | undefined {
    return typeof context.signature === 'string' ? context.signature : undefined;
}

function getFailedIndicator(isPreflight: boolean, signature: string | undefined): string {
    if (isPreflight) return ' (preflight)';
    if (signature) return ` (${signature})`;
    return '';
}
