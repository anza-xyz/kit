import {
    isSolanaError,
    type Lamports,
    sol,
    SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS,
    solToLamports,
} from '@solana/kit';

/**
 * Converts a user-supplied SOL amount (e.g. `"1.5"`) into {@link Lamports}.
 *
 * Parsing defaults to `strict` mode, which rejects values with more than 9 decimal places. When
 * that happens we replace the low-level fixed-point error with a friendly message suitable for
 * display in the UI; any other error is left untouched.
 *
 * @throws An `Error` with a user-friendly message when the SOL amount has too many decimal places.
 */
export function solStringToLamports(solQuantityString: string): Lamports {
    try {
        return solToLamports(sol(solQuantityString));
    } catch (e) {
        if (isSolanaError(e, SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS)) {
            throw new Error('Invalid SOL amount: use at most 9 decimal places.');
        }
        throw e;
    }
}
