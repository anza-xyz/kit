import { SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, SolanaError } from '@solana/errors';

import { decimalFixedPointToNumber, decimalFixedPointToString, rawDecimalFixedPoint } from '../decimal';

describe('decimalFixedPointToString', () => {
    it('renders zero', () => {
        expect(decimalFixedPointToString(rawDecimalFixedPoint('unsigned', 64, 2)(0n))).toBe('0');
    });

    it('renders a whole number with trailing zeros trimmed', () => {
        expect(decimalFixedPointToString(rawDecimalFixedPoint('unsigned', 64, 6)(42_000_000n))).toBe('42');
    });

    it('renders a clean fractional value with trailing zeros trimmed', () => {
        expect(decimalFixedPointToString(rawDecimalFixedPoint('unsigned', 64, 6)(42_500_000n))).toBe('42.5');
    });

    it('renders a sub-unit fraction with a leading zero padding', () => {
        expect(decimalFixedPointToString(rawDecimalFixedPoint('unsigned', 16, 2)(5n))).toBe('0.05');
    });

    it('renders a negative value with a leading sign', () => {
        expect(decimalFixedPointToString(rawDecimalFixedPoint('signed', 16, 2)(-5n))).toBe('-0.05');
    });

    it('renders an integer when decimals is zero', () => {
        expect(decimalFixedPointToString(rawDecimalFixedPoint('unsigned', 8, 0)(42n))).toBe('42');
    });

    it('renders values whose raw exceeds Number.MAX_SAFE_INTEGER correctly', () => {
        // 10 ** 20 / 10 ** 6 = 10 ** 14 = 100000000000000.
        const value = rawDecimalFixedPoint('unsigned', 128, 6)(10n ** 20n);
        expect(decimalFixedPointToString(value)).toBe('100000000000000');
    });

    it('caps the fractional output at the requested decimals using the given rounding mode', () => {
        // 42.678 at d3 → 2 decimals with floor → 42.67.
        const value = rawDecimalFixedPoint('unsigned', 64, 3)(42_678n);
        expect(decimalFixedPointToString(value, { decimals: 2, rounding: 'floor' })).toBe('42.67');
    });

    it('rounds half values away from zero under the round mode', () => {
        const value = rawDecimalFixedPoint('unsigned', 64, 1)(425n); // 42.5
        expect(decimalFixedPointToString(value, { decimals: 0, rounding: 'round' })).toBe('43');
    });

    it('trims trailing zeros even when the requested decimals is larger than the native scale', () => {
        const value = rawDecimalFixedPoint('unsigned', 64, 2)(4250n); // 42.5
        expect(decimalFixedPointToString(value, { decimals: 10 })).toBe('42.5');
    });

    it('pads trailing zeros up to the requested decimals when padTrailingZeros is true', () => {
        const value = rawDecimalFixedPoint('unsigned', 64, 2)(4250n); // 42.5
        expect(decimalFixedPointToString(value, { decimals: 6, padTrailingZeros: true })).toBe('42.500000');
    });

    it('pads trailing zeros up to the native decimals when padTrailingZeros is true and decimals is omitted', () => {
        const value = rawDecimalFixedPoint('unsigned', 64, 6)(42_500_000n); // 42.5 at d6
        expect(decimalFixedPointToString(value, { padTrailingZeros: true })).toBe('42.500000');
    });

    it('pads whole numbers with trailing zeros when padTrailingZeros is true', () => {
        const value = rawDecimalFixedPoint('unsigned', 64, 6)(0n);
        expect(decimalFixedPointToString(value, { padTrailingZeros: true })).toBe('0.000000');
    });

    it('throws STRICT_MODE_PRECISION_LOSS when a lossy cap is requested without a rounding mode', () => {
        const value = rawDecimalFixedPoint('unsigned', 64, 1)(425n); // 42.5
        expect(() => decimalFixedPointToString(value, { decimals: 0 })).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'decimalFixedPoint',
                operation: 'toString',
            }),
        );
    });

    it('does not throw when capping at the same number of decimals as the native scale', () => {
        const value = rawDecimalFixedPoint('unsigned', 64, 2)(4250n);
        expect(decimalFixedPointToString(value, { decimals: 2 })).toBe('42.5');
    });
});

describe('decimalFixedPointToNumber', () => {
    it('returns zero for zero', () => {
        expect(decimalFixedPointToNumber(rawDecimalFixedPoint('unsigned', 64, 2)(0n))).toBe(0);
    });

    it('returns 42.5 for raw 4250 at d2', () => {
        expect(decimalFixedPointToNumber(rawDecimalFixedPoint('unsigned', 64, 2)(4250n))).toBe(42.5);
    });

    it('returns -0.05 for raw -5 at d2', () => {
        expect(decimalFixedPointToNumber(rawDecimalFixedPoint('signed', 16, 2)(-5n))).toBe(-0.05);
    });

    it('returns the unscaled raw as a number when decimals is zero', () => {
        expect(decimalFixedPointToNumber(rawDecimalFixedPoint('signed', 8, 0)(-42n))).toBe(-42);
    });

    it('returns an approximate finite number when the raw exceeds Number.MAX_SAFE_INTEGER', () => {
        // 10 ** 20 / 10 ** 6 = 10 ** 14 = 100000000000000; the exact value fits Number cleanly.
        const value = rawDecimalFixedPoint('unsigned', 128, 6)(10n ** 20n);
        expect(decimalFixedPointToNumber(value)).toBeCloseTo(1e14, -2);
    });
});
