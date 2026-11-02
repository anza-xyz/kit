import {
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS,
    SolanaErrorCodeWithSimulationResult,
} from './codes';
import { isSolanaError, SolanaError } from './error';

// Typed as a record so that the compiler fails whenever this list and the
// `SolanaErrorCodeWithSimulationResult` union drift apart, in either direction.
const SIMULATION_ERROR_CODES: Readonly<Record<SolanaErrorCodeWithSimulationResult, true>> = {
    [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE]: true,
    [SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT]: true,
    [SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS]: true,
};

/**
 * A type guard that returns `true` if the input is a {@link SolanaError} thrown because a
 * transaction simulation failed.
 *
 * When this returns `true`, TypeScript will refine the error's
 * {@link SolanaError#context | `context`} to the simulation result (eg. `logs` and
 * `unitsConsumed`). The underlying transaction error, if any, is available as the error's `cause`.
 *
 * The following error codes are considered simulation errors:
 * - {@link SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE}
 * - {@link SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT}
 * - {@link SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS}
 *
 * @param e - The value to check.
 * @return `true` if the input is a simulation error, `false` otherwise.
 *
 * @example
 * Reading the simulation logs of a failed transaction.
 * ```ts
 * import { isSimulationError } from '@solana/errors';
 *
 * try {
 *     await sendTransaction(signedTransaction);
 * } catch (e) {
 *     if (isSimulationError(e)) {
 *         console.log('Simulation failed due to:', e.cause);
 *         console.log('Simulation logs:', e.context.logs);
 *     }
 *     throw e;
 * }
 * ```
 *
 * @see {@link unwrapSimulationError}
 */
export function isSimulationError(e: unknown): e is SolanaError<SolanaErrorCodeWithSimulationResult> {
    return isSolanaError(e) && e.context.__code in SIMULATION_ERROR_CODES;
}

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
 * See {@link isSimulationError} for the list of error codes considered simulation errors.
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
    if (isSimulationError(error) && !!error.cause) {
        return error.cause;
    }
    return error;
}
