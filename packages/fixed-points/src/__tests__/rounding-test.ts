import { SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, SolanaError } from '@solana/errors';

import { roundDivision, type RoundingMode } from '../rounding';

describe('roundDivision', () => {
    const div = (numerator: bigint, denominator: bigint, mode: RoundingMode) =>
        roundDivision('decimalFixedPoint', 'test', numerator, denominator, mode);

    it('returns the exact quotient when the division has no remainder', () => {
        for (const mode of ['ceil', 'floor', 'round', 'strict', 'trunc'] as const) {
            expect(div(10n, 2n, mode)).toBe(5n);
            expect(div(-10n, 2n, mode)).toBe(-5n);
            expect(div(0n, 7n, mode)).toBe(0n);
        }
    });

    it('throws under strict mode when division is inexact', () => {
        expect(() => div(10n, 3n, 'strict')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'decimalFixedPoint',
                operation: 'test',
            }),
        );
    });

    it('truncates toward zero under trunc', () => {
        expect(div(10n, 3n, 'trunc')).toBe(3n);
        expect(div(-10n, 3n, 'trunc')).toBe(-3n);
        expect(div(10n, -3n, 'trunc')).toBe(-3n);
        expect(div(-10n, -3n, 'trunc')).toBe(3n);
    });

    it('rounds toward negative infinity under floor', () => {
        expect(div(10n, 3n, 'floor')).toBe(3n);
        expect(div(-10n, 3n, 'floor')).toBe(-4n);
        expect(div(10n, -3n, 'floor')).toBe(-4n);
        expect(div(-10n, -3n, 'floor')).toBe(3n);
    });

    it('rounds toward positive infinity under ceil', () => {
        expect(div(10n, 3n, 'ceil')).toBe(4n);
        expect(div(-10n, 3n, 'ceil')).toBe(-3n);
        expect(div(10n, -3n, 'ceil')).toBe(-3n);
        expect(div(-10n, -3n, 'ceil')).toBe(4n);
    });

    it('rounds to nearest with ties away from zero under round', () => {
        // Non-tie: closer to the upper integer.
        expect(div(7n, 4n, 'round')).toBe(2n); // 1.75 -> 2
        expect(div(-7n, 4n, 'round')).toBe(-2n); // -1.75 -> -2

        // Non-tie: closer to the lower integer.
        expect(div(5n, 4n, 'round')).toBe(1n); // 1.25 -> 1
        expect(div(-5n, 4n, 'round')).toBe(-1n); // -1.25 -> -1

        // Ties break away from zero.
        expect(div(10n, 4n, 'round')).toBe(3n); // 2.5 -> 3
        expect(div(-10n, 4n, 'round')).toBe(-3n); // -2.5 -> -3
        expect(div(6n, 4n, 'round')).toBe(2n); // 1.5 -> 2
        expect(div(-6n, 4n, 'round')).toBe(-2n); // -1.5 -> -2
    });

    it('handles very large values without losing precision', () => {
        expect(div((1n << 200n) + 1n, 3n, 'floor')).toBe((1n << 200n) / 3n);
    });

    it('preserves the provided kind and operation in strict-mode errors', () => {
        expect(() => roundDivision('binaryFixedPoint', 'divide', 1n, 3n, 'strict')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'binaryFixedPoint',
                operation: 'divide',
            }),
        );
    });
});
