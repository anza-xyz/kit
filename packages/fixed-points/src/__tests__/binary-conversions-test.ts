import '@solana/test-matchers/toBeFrozenObject';

import { SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, SolanaError } from '@solana/errors';

import { rawBinaryFixedPoint, toSignedBinaryFixedPoint, toUnsignedBinaryFixedPoint } from '../binary';

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
