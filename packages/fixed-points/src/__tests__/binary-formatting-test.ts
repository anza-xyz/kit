import { SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, SolanaError } from '@solana/errors';

import {
    binaryFixedPoint,
    binaryFixedPointToNumber,
    binaryFixedPointToString,
    ratioBinaryFixedPoint,
    rawBinaryFixedPoint,
} from '../binary';

describe('binaryFixedPointToString', () => {
    it('renders zero', () => {
        expect(binaryFixedPointToString(rawBinaryFixedPoint('signed', 16, 15)(0n))).toBe('0');
    });

    it('renders a simple one-half fraction', () => {
        expect(binaryFixedPointToString(rawBinaryFixedPoint('unsigned', 8, 1)(1n))).toBe('0.5');
    });

    it('renders a simple one-quarter fraction', () => {
        expect(binaryFixedPointToString(rawBinaryFixedPoint('unsigned', 8, 2)(1n))).toBe('0.25');
    });

    it('renders a negative half', () => {
        expect(binaryFixedPointToString(rawBinaryFixedPoint('signed', 16, 15)(-16384n))).toBe('-0.5');
    });

    it('renders an integer when fractionalBits is zero', () => {
        expect(binaryFixedPointToString(rawBinaryFixedPoint('unsigned', 8, 0)(42n))).toBe('42');
    });

    it('renders a negative integer when fractionalBits is zero', () => {
        expect(binaryFixedPointToString(rawBinaryFixedPoint('signed', 8, 0)(-42n))).toBe('-42');
    });

    it('emits the full exact decimal expansion by default', () => {
        // 1 / 2 ** 15 = 0.000030517578125 exactly.
        expect(binaryFixedPointToString(rawBinaryFixedPoint('unsigned', 16, 15)(1n))).toBe('0.000030517578125');
    });

    it('renders a ratio-built value cleanly', () => {
        const probability = ratioBinaryFixedPoint('signed', 16, 15);
        expect(binaryFixedPointToString(probability(1n, 4n))).toBe('0.25');
    });

    it('caps the fractional output at the requested decimals using the given rounding mode', () => {
        // The raw value represents 0.480010986328125 exactly; rounded to 2 decimals → 0.48.
        const ugly = rawBinaryFixedPoint('signed', 16, 15)(15729n);
        expect(binaryFixedPointToString(ugly, { decimals: 2, rounding: 'round' })).toBe('0.48');
    });

    it('trims trailing zeros even when the requested decimals is larger than necessary', () => {
        const value = rawBinaryFixedPoint('unsigned', 8, 1)(1n); // 0.5
        expect(binaryFixedPointToString(value, { decimals: 6 })).toBe('0.5');
    });

    it('pads trailing zeros up to the requested decimals when padTrailingZeros is true', () => {
        const value = rawBinaryFixedPoint('unsigned', 8, 1)(1n); // 0.5
        expect(binaryFixedPointToString(value, { decimals: 6, padTrailingZeros: true })).toBe('0.500000');
    });

    it('pads trailing zeros up to the native fractionalBits when padTrailingZeros is true and decimals is omitted', () => {
        const value = rawBinaryFixedPoint('unsigned', 8, 1)(1n); // 0.5 with a single fractional bit.
        expect(binaryFixedPointToString(value, { padTrailingZeros: true })).toBe('0.5');
    });

    it('pads trailing zeros up to fractionalBits for a longer native scale', () => {
        const value = binaryFixedPoint('signed', 16, 15)('0.5');
        expect(binaryFixedPointToString(value, { padTrailingZeros: true })).toBe('0.500000000000000');
    });

    it('pads whole numbers with trailing zeros when padTrailingZeros is true', () => {
        const value = rawBinaryFixedPoint('unsigned', 8, 1)(0n);
        expect(binaryFixedPointToString(value, { decimals: 3, padTrailingZeros: true })).toBe('0.000');
    });

    it('throws STRICT_MODE_PRECISION_LOSS when a lossy cap is requested without a rounding mode', () => {
        // 1 / 2 ** 15 cannot be represented at 2 decimals without loss.
        const value = rawBinaryFixedPoint('unsigned', 16, 15)(1n);
        expect(() => binaryFixedPointToString(value, { decimals: 2 })).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'binaryFixedPoint',
                operation: 'toString',
            }),
        );
    });

    it('does not throw when capping at the same number of decimals as the native expansion', () => {
        const value = rawBinaryFixedPoint('unsigned', 16, 15)(1n);
        expect(binaryFixedPointToString(value, { decimals: 15 })).toBe('0.000030517578125');
    });
});

describe('binaryFixedPointToNumber', () => {
    it('returns zero for zero', () => {
        expect(binaryFixedPointToNumber(rawBinaryFixedPoint('signed', 16, 15)(0n))).toBe(0);
    });

    it('returns one half for a raw value halfway to one', () => {
        expect(binaryFixedPointToNumber(rawBinaryFixedPoint('unsigned', 8, 1)(1n))).toBe(0.5);
    });

    it('returns one quarter for a raw value a quarter of the way to one', () => {
        expect(binaryFixedPointToNumber(rawBinaryFixedPoint('unsigned', 8, 2)(1n))).toBe(0.25);
    });

    it('returns negative one half for a negative half raw value', () => {
        expect(binaryFixedPointToNumber(rawBinaryFixedPoint('signed', 16, 15)(-16384n))).toBe(-0.5);
    });

    it('returns the unscaled raw as a number when fractionalBits is zero', () => {
        expect(binaryFixedPointToNumber(rawBinaryFixedPoint('signed', 8, 0)(-42n))).toBe(-42);
    });

    it('returns a very small but finite number for large fractionalBits', () => {
        expect(binaryFixedPointToNumber(rawBinaryFixedPoint('unsigned', 64, 53)(1n))).toBe(2 ** -53);
    });

    it('preserves low-order bits when the raw value exceeds Number.MAX_SAFE_INTEGER but the result fits', () => {
        // raw = 2 ** 60 + (2 ** 20 - 1) at fractionalBits = 20 represents
        // 2 ** 40 + (2 ** 20 - 1) / 2 ** 20, which fits within 53 bits of mantissa.
        // A naive `Number(raw) / 2 ** 20` would round `raw` at bit level 8 and
        // return 2 ** 40 + 1; the split preserves the fractional part.
        const raw = (1n << 60n) + ((1n << 20n) - 1n);
        const value = rawBinaryFixedPoint('unsigned', 128, 20)(raw);
        expect(binaryFixedPointToNumber(value)).toBe(2 ** 40 + (2 ** 20 - 1) / 2 ** 20);
    });

    it('preserves low-order bits for negative values that exceed Number.MAX_SAFE_INTEGER', () => {
        const raw = -((1n << 60n) + ((1n << 20n) - 1n));
        const value = rawBinaryFixedPoint('signed', 128, 20)(raw);
        expect(binaryFixedPointToNumber(value)).toBe(-(2 ** 40 + (2 ** 20 - 1) / 2 ** 20));
    });
});
