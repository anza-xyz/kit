import { SOLANA_ERROR__FIXED_POINTS__INVALID_STRING, SolanaError } from '@solana/errors';

/**
 * Parses a human-readable decimal string into a decimal fixed-point
 * representation `{ raw, decimals }` such that the parsed value is exactly
 * `raw / 10 ** decimals`.
 *
 * Accepts strings of the form:
 * - `"123"`, `"-123"`
 * - `"12.5"`, `"-0.25"`
 * - `".5"`, `"-.5"`, `"5."`
 *
 * Rejects scientific notation, leading `+`, whitespace, and any other
 * non-digit / non-sign / non-decimal-point characters.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__INVALID_STRING` for malformed input.
 *
 * @internal
 */
export function parseDecimalString(
    kind: 'binaryFixedPoint' | 'decimalFixedPoint',
    input: string,
): { decimals: number; raw: bigint } {
    if (typeof input !== 'string' || !/^-?(?:\d+\.?\d*|\.\d+)$/.test(input)) {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_STRING, {
            input: String(input),
            kind,
        });
    }
    const isNegative = input.startsWith('-');
    const unsigned = isNegative ? input.slice(1) : input;
    const dotIndex = unsigned.indexOf('.');
    let integerPart: string;
    let fractionalPart: string;
    if (dotIndex === -1) {
        integerPart = unsigned;
        fractionalPart = '';
    } else {
        integerPart = unsigned.slice(0, dotIndex);
        fractionalPart = unsigned.slice(dotIndex + 1);
    }
    const digits = (integerPart || '0') + fractionalPart;
    const rawAbs = BigInt(digits);
    const raw = isNegative ? -rawAbs : rawAbs;
    return { decimals: fractionalPart.length, raw };
}
