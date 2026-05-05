import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW,
    SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_FRACTIONAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS,
    SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import {
    binaryFixedPoint,
    binaryFixedPointToBase10,
    rawBinaryFixedPoint,
    rescaleBinaryFixedPoint,
    toSignedBinaryFixedPoint,
    toUnsignedBinaryFixedPoint,
} from '../binary';

describe('binaryFixedPointToBase10', () => {
    it('returns a zero raw and the value fractionalBits as decimals for zero', () => {
        const value = rawBinaryFixedPoint('signed', 16, 15)(0n);
        expect(binaryFixedPointToBase10(value)).toStrictEqual({ decimals: 15, raw: 0n });
    });

    it('returns the input raw unchanged when fractionalBits is zero', () => {
        const value = rawBinaryFixedPoint('signed', 8, 0)(-42n);
        expect(binaryFixedPointToBase10(value)).toStrictEqual({ decimals: 0, raw: -42n });
    });

    it('scales the raw by 5 ** fractionalBits to reach base 10', () => {
        // raw 1 at QX.1 represents 0.5 → (1 * 5) / 10 = 0.5.
        const value = rawBinaryFixedPoint('unsigned', 8, 1)(1n);
        expect(binaryFixedPointToBase10(value)).toStrictEqual({ decimals: 1, raw: 5n });
    });

    it('preserves the sign of negative values', () => {
        // raw -16384 at Q1.15 represents -0.5 → (-16384 * 5 ** 15) / 10 ** 15.
        const value = rawBinaryFixedPoint('signed', 16, 15)(-16384n);
        const base10 = binaryFixedPointToBase10(value);
        expect(base10.decimals).toBe(15);
        expect(base10.raw).toBe(-500000000000000n);
    });

    it('produces the full exact decimal expansion for a smallest-unit value', () => {
        // 1 / 2 ** 15 = 0.000030517578125 = 30517578125 / 10 ** 15.
        const value = rawBinaryFixedPoint('unsigned', 16, 15)(1n);
        expect(binaryFixedPointToBase10(value)).toStrictEqual({ decimals: 15, raw: 30517578125n });
    });

    it('handles raw values that exceed Number.MAX_SAFE_INTEGER', () => {
        // raw 2 ** 60 at QX.20 represents 2 ** 40 → (2 ** 60) * 5 ** 20 / 10 ** 20.
        const raw = 1n << 60n;
        const value = rawBinaryFixedPoint('unsigned', 128, 20)(raw);
        const base10 = binaryFixedPointToBase10(value);
        expect(base10.decimals).toBe(20);
        expect(base10.raw).toBe(raw * 5n ** 20n);
        // Sanity-check the round trip: dividing by 10 ** 20 yields 2 ** 40.
        expect(base10.raw / 10n ** 20n).toBe(1n << 40n);
    });
});

describe('toUnsignedBinaryFixedPoint', () => {
    it('converts a signed non-negative value to unsigned', () => {
        const signed = rawBinaryFixedPoint('signed', 8, 4)(100n);
        const unsigned = toUnsignedBinaryFixedPoint(signed);
        expect(unsigned.signedness).toBe('unsigned');
        expect(unsigned.raw).toBe(100n);
    });

    it('returns the same reference when the input is already unsigned', () => {
        const unsigned = rawBinaryFixedPoint('unsigned', 8, 4)(100n);
        expect(toUnsignedBinaryFixedPoint(unsigned)).toBe(unsigned);
    });

    it('preserves totalBits and fractionalBits', () => {
        const signed = rawBinaryFixedPoint('signed', 16, 15)(1n);
        const unsigned = toUnsignedBinaryFixedPoint(signed);
        expect(unsigned.totalBits).toBe(16);
        expect(unsigned.fractionalBits).toBe(15);
    });

    it('returns a frozen value', () => {
        const signed = rawBinaryFixedPoint('signed', 8, 4)(100n);
        expect(toUnsignedBinaryFixedPoint(signed)).toBeFrozenObject();
    });

    it('throws VALUE_OUT_OF_RANGE when converting a negative value', () => {
        const signed = rawBinaryFixedPoint('signed', 8, 4)(-1n);
        expect(() => toUnsignedBinaryFixedPoint(signed)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'binaryFixedPoint',
                max: 255n,
                min: 0n,
                raw: -1n,
                signedness: 'unsigned',
                totalBits: 8,
            }),
        );
    });
});

describe('toSignedBinaryFixedPoint', () => {
    it('converts an unsigned value that fits the signed range', () => {
        const unsigned = rawBinaryFixedPoint('unsigned', 8, 4)(100n);
        const signed = toSignedBinaryFixedPoint(unsigned);
        expect(signed.signedness).toBe('signed');
        expect(signed.raw).toBe(100n);
    });

    it('returns the same reference when the input is already signed', () => {
        const signed = rawBinaryFixedPoint('signed', 8, 4)(-50n);
        expect(toSignedBinaryFixedPoint(signed)).toBe(signed);
    });

    it('preserves totalBits and fractionalBits', () => {
        const unsigned = rawBinaryFixedPoint('unsigned', 16, 15)(1n);
        const signed = toSignedBinaryFixedPoint(unsigned);
        expect(signed.totalBits).toBe(16);
        expect(signed.fractionalBits).toBe(15);
    });

    it('returns a frozen value', () => {
        const unsigned = rawBinaryFixedPoint('unsigned', 8, 4)(100n);
        expect(toSignedBinaryFixedPoint(unsigned)).toBeFrozenObject();
    });

    it('throws VALUE_OUT_OF_RANGE when the unsigned value exceeds the signed upper bound', () => {
        const unsigned = rawBinaryFixedPoint('unsigned', 8, 4)(200n);
        expect(() => toSignedBinaryFixedPoint(unsigned)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'binaryFixedPoint',
                max: 127n,
                min: -128n,
                raw: 200n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });
});

describe('rescaleBinaryFixedPoint', () => {
    it('returns the same reference when the requested shape matches', () => {
        const value = binaryFixedPoint('signed', 16, 15)('0.5');
        expect(rescaleBinaryFixedPoint(value, 16, 15)).toBe(value);
    });

    it('scales up fractionalBits exactly', () => {
        // raw 1 at Q?.2 represents 0.25; moving to Q?.4 scales raw to 4.
        const source = rawBinaryFixedPoint('unsigned', 8, 2)(1n);
        const rescaled = rescaleBinaryFixedPoint(source, 8, 4);
        expect(rescaled.raw).toBe(4n);
        expect(rescaled.fractionalBits).toBe(4);
        expect(rescaled.totalBits).toBe(8);
    });

    it('scales down fractionalBits exactly', () => {
        // raw 16 at Q?.4 represents 1.0; moving to Q?.2 scales raw to 4.
        const source = rawBinaryFixedPoint('unsigned', 8, 4)(16n);
        expect(rescaleBinaryFixedPoint(source, 8, 2).raw).toBe(4n);
    });

    it('widens totalBits while preserving fractionalBits and raw', () => {
        const source = rawBinaryFixedPoint('unsigned', 8, 4)(10n);
        const rescaled = rescaleBinaryFixedPoint(source, 16, 4);
        expect(rescaled.raw).toBe(10n);
        expect(rescaled.totalBits).toBe(16);
        expect(rescaled.fractionalBits).toBe(4);
    });

    it('narrows totalBits when the value fits', () => {
        const source = rawBinaryFixedPoint('unsigned', 16, 0)(100n);
        expect(rescaleBinaryFixedPoint(source, 8, 0).raw).toBe(100n);
    });

    it('preserves signedness', () => {
        const source = rawBinaryFixedPoint('signed', 8, 0)(-1n);
        expect(rescaleBinaryFixedPoint(source, 16, 0).signedness).toBe('signed');
    });

    it('returns a frozen value when the shape changes', () => {
        const source = rawBinaryFixedPoint('unsigned', 8, 2)(1n);
        expect(rescaleBinaryFixedPoint(source, 8, 4)).toBeFrozenObject();
    });

    it('throws STRICT_MODE_PRECISION_LOSS under the default rounding when scale-down is inexact', () => {
        // raw 1 at Q?.2 represents 0.25; moving to Q?.1 would halve it (0.5 / 0.5 = 0 or 1).
        const source = rawBinaryFixedPoint('unsigned', 8, 2)(1n);
        expect(() => rescaleBinaryFixedPoint(source, 8, 1)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'binaryFixedPoint',
                operation: 'rescale',
            }),
        );
    });

    it('rounds an inexact scale-down when a non-strict rounding mode is supplied', () => {
        const source = rawBinaryFixedPoint('unsigned', 8, 2)(1n);
        expect(rescaleBinaryFixedPoint(source, 8, 1, 'floor').raw).toBe(0n);
        expect(rescaleBinaryFixedPoint(source, 8, 1, 'ceil').raw).toBe(1n);
    });

    it('throws ARITHMETIC_OVERFLOW when narrowing totalBits overflows the target range', () => {
        const source = rawBinaryFixedPoint('unsigned', 16, 0)(300n);
        expect(() => rescaleBinaryFixedPoint(source, 8, 0)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'binaryFixedPoint',
                max: 255n,
                min: 0n,
                operation: 'rescale',
                result: 300n,
                signedness: 'unsigned',
                totalBits: 8,
            }),
        );
    });

    it('throws ARITHMETIC_OVERFLOW when scaling up fractionalBits overflows the target totalBits', () => {
        // raw 100 at Q?.0 → scaling up to Q?.4 multiplies by 16 → 1600 which exceeds signed 8-bit max 127.
        const source = rawBinaryFixedPoint('signed', 8, 0)(100n);
        expect(() => rescaleBinaryFixedPoint(source, 8, 4)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'binaryFixedPoint',
                max: 127n,
                min: -128n,
                operation: 'rescale',
                result: 1600n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });

    it('throws INVALID_TOTAL_BITS for a non-positive target totalBits', () => {
        const source = rawBinaryFixedPoint('unsigned', 8, 4)(1n);
        expect(() => rescaleBinaryFixedPoint(source, 0, 0)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS, {
                kind: 'binaryFixedPoint',
                totalBits: 0,
            }),
        );
    });

    it('throws INVALID_FRACTIONAL_BITS for a negative target fractionalBits', () => {
        const source = rawBinaryFixedPoint('unsigned', 8, 4)(1n);
        expect(() => rescaleBinaryFixedPoint(source, 8, -1)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_FRACTIONAL_BITS, {
                fractionalBits: -1,
            }),
        );
    });

    it('throws FRACTIONAL_BITS_EXCEED_TOTAL_BITS when the target fractionalBits exceeds totalBits', () => {
        const source = rawBinaryFixedPoint('unsigned', 16, 4)(1n);
        expect(() => rescaleBinaryFixedPoint(source, 8, 16)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS, {
                fractionalBits: 16,
                totalBits: 8,
            }),
        );
    });
});
