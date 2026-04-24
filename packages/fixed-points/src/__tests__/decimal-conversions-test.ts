import '@solana/test-matchers/toBeFrozenObject';

import { SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, SolanaError } from '@solana/errors';

import { rawDecimalFixedPoint, toSignedDecimalFixedPoint, toUnsignedDecimalFixedPoint } from '../decimal';

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
