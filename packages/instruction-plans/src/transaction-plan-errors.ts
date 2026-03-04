import {
    isSolanaError,
    type RpcSimulateTransactionResult,
    SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION,
    SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS,
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
 */
export function createFailedToSendTransactionError(
    result: CanceledSingleTransactionPlanResult | FailedSingleTransactionPlanResult,
    abortReason?: unknown,
): SolanaError<typeof SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION> {
    let causeMessage: string;
    let cause: unknown;
    let logs: readonly string[] | undefined;
    let preflightData: PreflightData | undefined;

    if (result.status === 'failed') {
        const unwrapped = unwrapErrorWithPreflightData(result.error);
        logs = unwrapped.logs;
        preflightData = unwrapped.preflightData;
        cause = unwrapped.unwrappedError;
        const indicator = getFailedIndicator(!!preflightData, result.context.signature);
        causeMessage = `${indicator}: ${(cause as Error).message}`;
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
    return new SolanaError(SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION, context);
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
 */
export function createFailedToSendTransactionsError(
    result: TransactionPlanResult,
    abortReason?: unknown,
): SolanaError<typeof SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS> {
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
            const indicator = getFailedIndicator(!!preflightData, flattenedResults[index].context.signature);
            return `\n[Tx #${index + 1}${indicator}] ${error.message}`;
        });
        causeMessages = `.${failureLines.join('')}`;
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
    return new SolanaError(SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS, context);
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
        const { __code, ...rest } = error.context;
        // TODO(loris): Remove this cast once FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT
        // is enriched with the full simulation result (logs, accounts, etc.).
        const preflightData = rest as unknown as PreflightData;
        return {
            logs: preflightData.logs ?? undefined,
            preflightData,
            unwrappedError: error.cause ?? error,
        };
    }
    return { logs: undefined, preflightData: undefined, unwrappedError: error };
}

function getFailedIndicator(isPreflight: boolean, signature: string | undefined): string {
    if (isPreflight) return ' (preflight)';
    if (signature) return ` (${signature})`;
    return '';
}
