import {
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
    SolanaErrorCode,
} from './codes';
import { isSolanaError } from './error';

/**
 * Extracts the underlying cause from a simulation-related error.
 *
 * When a transaction simulation fails, the error is often wrapped in a
 * simulation-specific {@link SolanaError}. This function unwraps such errors
 * by returning the `cause` property, giving you access to the actual error
 * that triggered the simulation failure.
 *
 * If the provided error is not a simulation-related error, it is returned unchanged.
 *
 * The following error codes are considered simulation errors:
 * - {@link SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE}
 * - {@link SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT}
 *
 * @param error - The error to unwrap.
 * @return The underlying cause if the error is a simulation error, otherwise the original error.
 *
 * @example
 * Unwrapping a preflight failure to access the root cause.
 * ```ts
 * import { unwrapSimulationError } from '@solana/errors';
 *
 * try {
 *     await sendTransaction(signedTransaction);
 * } catch (e) {
 *     const cause = unwrapSimulationError(e);
 *     console.log('Send transaction failed due to:', cause);
 * }
 * ```
 */
export function unwrapSimulationError(error: unknown): unknown {
    const simulationCodes: SolanaErrorCode[] = [
        SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
        SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
    ];
    if (isSolanaError(error) && !!error.cause && simulationCodes.includes(error.context.__code)) {
        return error.cause;
    }
    return error;
}
