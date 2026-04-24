import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW,
    SOLANA_ERROR__FIXED_POINTS__INVALID_DECIMALS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS,
    SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import {
    decimalFixedPoint,
    rawDecimalFixedPoint,
    rescaleDecimalFixedPoint,
    toSignedDecimalFixedPoint,
    toUnsignedDecimalFixedPoint,
} from '../decimal';

describe('toUnsignedDecimalFixedPoint', () => {
    it('converts a signed non-negative value to unsigned', () => {
        const signed = rawDecimalFixedPoint('signed', 8, 2)(100n);
        const unsigned = toUnsignedDecimalFixedPoint(signed);
        expect(unsigned.signedness).toBe('unsigned');
        expect(unsigned.raw).toBe(100n);
    });

    it('returns the same reference when the input is already unsigned', () => {
        const unsigned = rawDecimalFixedPoint('unsigned', 8, 2)(100n);
        expect(toUnsignedDecimalFixedPoint(unsigned)).toBe(unsigned);
    });

    it('preserves totalBits and decimals', () => {
        const signed = rawDecimalFixedPoint('signed', 64, 6)(1n);
        const unsigned = toUnsignedDecimalFixedPoint(signed);
        expect(unsigned.totalBits).toBe(64);
        expect(unsigned.decimals).toBe(6);
    });

    it('returns a frozen value', () => {
        const signed = rawDecimalFixedPoint('signed', 8, 2)(100n);
        expect(toUnsignedDecimalFixedPoint(signed)).toBeFrozenObject();
    });

    it('throws VALUE_OUT_OF_RANGE when converting a negative value', () => {
        const signed = rawDecimalFixedPoint('signed', 8, 2)(-1n);
        expect(() => toUnsignedDecimalFixedPoint(signed)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'decimalFixedPoint',
                max: 255n,
                min: 0n,
                raw: -1n,
                signedness: 'unsigned',
                totalBits: 8,
            }),
        );
    });
});

describe('toSignedDecimalFixedPoint', () => {
    it('converts an unsigned value that fits the signed range', () => {
        const unsigned = rawDecimalFixedPoint('unsigned', 8, 2)(100n);
        const signed = toSignedDecimalFixedPoint(unsigned);
        expect(signed.signedness).toBe('signed');
        expect(signed.raw).toBe(100n);
    });

    it('returns the same reference when the input is already signed', () => {
        const signed = rawDecimalFixedPoint('signed', 8, 2)(-50n);
        expect(toSignedDecimalFixedPoint(signed)).toBe(signed);
    });

    it('preserves totalBits and decimals', () => {
        const unsigned = rawDecimalFixedPoint('unsigned', 64, 6)(1n);
        const signed = toSignedDecimalFixedPoint(unsigned);
        expect(signed.totalBits).toBe(64);
        expect(signed.decimals).toBe(6);
    });

    it('returns a frozen value', () => {
        const unsigned = rawDecimalFixedPoint('unsigned', 8, 2)(100n);
        expect(toSignedDecimalFixedPoint(unsigned)).toBeFrozenObject();
    });

    it('throws VALUE_OUT_OF_RANGE when the unsigned value exceeds the signed upper bound', () => {
        const unsigned = rawDecimalFixedPoint('unsigned', 8, 2)(200n);
        expect(() => toSignedDecimalFixedPoint(unsigned)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'decimalFixedPoint',
                max: 127n,
                min: -128n,
                raw: 200n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });
});

describe('rescaleDecimalFixedPoint', () => {
    it('returns the same reference when the requested shape matches', () => {
        const value = decimalFixedPoint('unsigned', 64, 2)('1.50');
        expect(rescaleDecimalFixedPoint(value, 64, 2)).toBe(value);
    });

    it('scales up decimals exactly', () => {
        // raw 1 at d2 represents 0.01; moving to d4 scales raw to 100.
        const source = rawDecimalFixedPoint('unsigned', 64, 2)(1n);
        const rescaled = rescaleDecimalFixedPoint(source, 64, 4);
        expect(rescaled.raw).toBe(100n);
        expect(rescaled.decimals).toBe(4);
        expect(rescaled.totalBits).toBe(64);
    });

    it('scales down decimals exactly', () => {
        // raw 100 at d4 represents 0.01; moving to d2 scales raw to 1.
        const source = rawDecimalFixedPoint('unsigned', 64, 4)(100n);
        expect(rescaleDecimalFixedPoint(source, 64, 2).raw).toBe(1n);
    });

    it('widens totalBits while preserving decimals and raw', () => {
        const source = rawDecimalFixedPoint('unsigned', 16, 2)(100n);
        const rescaled = rescaleDecimalFixedPoint(source, 64, 2);
        expect(rescaled.raw).toBe(100n);
        expect(rescaled.totalBits).toBe(64);
        expect(rescaled.decimals).toBe(2);
    });

    it('narrows totalBits when the value fits', () => {
        const source = rawDecimalFixedPoint('unsigned', 16, 0)(100n);
        expect(rescaleDecimalFixedPoint(source, 8, 0).raw).toBe(100n);
    });

    it('preserves signedness', () => {
        const source = rawDecimalFixedPoint('signed', 16, 2)(-100n);
        expect(rescaleDecimalFixedPoint(source, 32, 2).signedness).toBe('signed');
    });

    it('returns a frozen value when the shape changes', () => {
        const source = rawDecimalFixedPoint('unsigned', 64, 2)(1n);
        expect(rescaleDecimalFixedPoint(source, 64, 4)).toBeFrozenObject();
    });

    it('bridges EVM USDC (u128 d18) down to SPL USDC (u64 d6) with floor rounding', () => {
        const evmUsdc = decimalFixedPoint('unsigned', 128, 18);
        const bridged = rescaleDecimalFixedPoint(evmUsdc('100.123456789012345678'), 64, 6, 'floor');
        expect(bridged.raw).toBe(100_123_456n);
        expect(bridged.totalBits).toBe(64);
        expect(bridged.decimals).toBe(6);
    });

    it('throws STRICT_MODE_PRECISION_LOSS under the default rounding when scale-down is inexact', () => {
        // raw 1 at d4 represents 0.0001; moving to d2 requires dividing by 100 which is lossy.
        const source = rawDecimalFixedPoint('unsigned', 64, 4)(1n);
        expect(() => rescaleDecimalFixedPoint(source, 64, 2)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'decimalFixedPoint',
                operation: 'rescale',
            }),
        );
    });

    it('rounds an inexact scale-down when a non-strict rounding mode is supplied', () => {
        const source = rawDecimalFixedPoint('unsigned', 64, 4)(1n);
        expect(rescaleDecimalFixedPoint(source, 64, 2, 'floor').raw).toBe(0n);
        expect(rescaleDecimalFixedPoint(source, 64, 2, 'ceil').raw).toBe(1n);
    });

    it('throws ARITHMETIC_OVERFLOW when narrowing totalBits overflows the target range', () => {
        const source = rawDecimalFixedPoint('unsigned', 16, 0)(300n);
        expect(() => rescaleDecimalFixedPoint(source, 8, 0)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'decimalFixedPoint',
                max: 255n,
                min: 0n,
                operation: 'rescale',
                result: 300n,
                signedness: 'unsigned',
                totalBits: 8,
            }),
        );
    });

    it('throws ARITHMETIC_OVERFLOW when scaling up decimals overflows the target totalBits', () => {
        // raw 100 at d0 → scaling up to d2 multiplies by 100 → 10000 which exceeds signed 8-bit max 127.
        const source = rawDecimalFixedPoint('signed', 8, 0)(100n);
        expect(() => rescaleDecimalFixedPoint(source, 8, 2)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'decimalFixedPoint',
                max: 127n,
                min: -128n,
                operation: 'rescale',
                result: 10000n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });

    it('throws INVALID_TOTAL_BITS for a non-positive target totalBits', () => {
        const source = rawDecimalFixedPoint('unsigned', 8, 2)(1n);
        expect(() => rescaleDecimalFixedPoint(source, 0, 0)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS, {
                kind: 'decimalFixedPoint',
                totalBits: 0,
            }),
        );
    });

    it('throws INVALID_DECIMALS for a negative target decimals', () => {
        const source = rawDecimalFixedPoint('unsigned', 8, 2)(1n);
        expect(() => rescaleDecimalFixedPoint(source, 8, -1)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_DECIMALS, {
                decimals: -1,
            }),
        );
    });
});
