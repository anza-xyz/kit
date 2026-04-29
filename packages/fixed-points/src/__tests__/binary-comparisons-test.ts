import { SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, SolanaError } from '@solana/errors';

import {
    binaryFixedPoint,
    cmpBinaryFixedPoint,
    eqBinaryFixedPoint,
    gtBinaryFixedPoint,
    gteBinaryFixedPoint,
    ltBinaryFixedPoint,
    lteBinaryFixedPoint,
    rawBinaryFixedPoint,
} from '../binary';

describe('cmpBinaryFixedPoint', () => {
    it('returns -1 when the first operand is smaller', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(cmpBinaryFixedPoint(q1_15('0.25'), q1_15('0.5'))).toBe(-1);
    });

    it('returns 0 when the two operands are equal', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(cmpBinaryFixedPoint(q1_15('0.5'), q1_15('0.5'))).toBe(0);
    });

    it('returns 1 when the first operand is greater', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(cmpBinaryFixedPoint(q1_15('0.75'), q1_15('0.5'))).toBe(1);
    });

    it('compares negative and positive signed values correctly', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(cmpBinaryFixedPoint(q1_15('-0.5'), q1_15('0.5'))).toBe(-1);
        expect(cmpBinaryFixedPoint(q1_15('-0.5'), q1_15('-0.5'))).toBe(0);
        expect(cmpBinaryFixedPoint(q1_15('-0.25'), q1_15('-0.5'))).toBe(1);
    });

    it('treats zero as equal to zero', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(cmpBinaryFixedPoint(q1_15('0'), q1_15('0'))).toBe(0);
    });

    it('allows operands with different signedness', () => {
        const signed = rawBinaryFixedPoint('signed', 16, 15);
        const unsigned = rawBinaryFixedPoint('unsigned', 16, 15);
        expect(cmpBinaryFixedPoint(signed(-1n), unsigned(1n))).toBe(-1);
        expect(cmpBinaryFixedPoint(signed(1n), unsigned(1n))).toBe(0);
        expect(cmpBinaryFixedPoint(signed(2n), unsigned(1n))).toBe(1);
    });

    it('allows operands with different totalBits', () => {
        const small = rawBinaryFixedPoint('unsigned', 8, 4);
        const large = rawBinaryFixedPoint('unsigned', 32, 4);
        expect(cmpBinaryFixedPoint(small(16n), large(16n))).toBe(0);
        expect(cmpBinaryFixedPoint(small(16n), large(32n))).toBe(-1);
    });

    it('allows operands with different signedness and totalBits combined', () => {
        const signed8 = rawBinaryFixedPoint('signed', 8, 0);
        const unsigned32 = rawBinaryFixedPoint('unsigned', 32, 0);
        expect(cmpBinaryFixedPoint(signed8(5n), unsigned32(5n))).toBe(0);
    });

    it('throws SHAPE_MISMATCH when fractionalBits differ', () => {
        const q1_15 = rawBinaryFixedPoint('signed', 16, 15);
        const q8_8 = rawBinaryFixedPoint('signed', 16, 8);
        expect(() =>
            // @ts-expect-error Operands must share the same fractionalBits.
            cmpBinaryFixedPoint(q1_15(1n), q8_8(1n)),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'binaryFixedPoint',
                actualScale: 8,
                actualScaleLabel: 'fractional bits',
                actualSignedness: 'signed',
                actualTotalBits: 16,
                expectedKind: 'binaryFixedPoint',
                expectedScale: 15,
                expectedScaleLabel: 'fractional bits',
                expectedSignedness: 'signed',
                expectedTotalBits: 16,
                operation: 'cmpBinaryFixedPoint',
            }),
        );
    });

    it('throws SHAPE_MISMATCH when the second operand is not a fixed-point value', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(() =>
            // @ts-expect-error Second operand must be a BinaryFixedPoint.
            cmpBinaryFixedPoint(q1_15('0.5'), 42),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'unknown',
                actualScale: 0,
                actualScaleLabel: 'unknown',
                actualSignedness: 'unknown',
                actualTotalBits: 0,
                expectedKind: 'binaryFixedPoint',
                expectedScale: 15,
                expectedScaleLabel: 'fractional bits',
                expectedSignedness: 'unknown',
                expectedTotalBits: 0,
                operation: 'cmpBinaryFixedPoint',
            }),
        );
    });
});

describe('eqBinaryFixedPoint', () => {
    it('returns the expected boolean for less, equal, and greater', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(eqBinaryFixedPoint(q1_15('0.25'), q1_15('0.5'))).toBe(false);
        expect(eqBinaryFixedPoint(q1_15('0.5'), q1_15('0.5'))).toBe(true);
        expect(eqBinaryFixedPoint(q1_15('0.75'), q1_15('0.5'))).toBe(false);
    });
});

describe('ltBinaryFixedPoint', () => {
    it('returns the expected boolean for less, equal, and greater', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(ltBinaryFixedPoint(q1_15('0.25'), q1_15('0.5'))).toBe(true);
        expect(ltBinaryFixedPoint(q1_15('0.5'), q1_15('0.5'))).toBe(false);
        expect(ltBinaryFixedPoint(q1_15('0.75'), q1_15('0.5'))).toBe(false);
    });
});

describe('lteBinaryFixedPoint', () => {
    it('returns the expected boolean for less, equal, and greater', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(lteBinaryFixedPoint(q1_15('0.25'), q1_15('0.5'))).toBe(true);
        expect(lteBinaryFixedPoint(q1_15('0.5'), q1_15('0.5'))).toBe(true);
        expect(lteBinaryFixedPoint(q1_15('0.75'), q1_15('0.5'))).toBe(false);
    });
});

describe('gtBinaryFixedPoint', () => {
    it('returns the expected boolean for less, equal, and greater', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(gtBinaryFixedPoint(q1_15('0.25'), q1_15('0.5'))).toBe(false);
        expect(gtBinaryFixedPoint(q1_15('0.5'), q1_15('0.5'))).toBe(false);
        expect(gtBinaryFixedPoint(q1_15('0.75'), q1_15('0.5'))).toBe(true);
    });
});

describe('gteBinaryFixedPoint', () => {
    it('returns the expected boolean for less, equal, and greater', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(gteBinaryFixedPoint(q1_15('0.25'), q1_15('0.5'))).toBe(false);
        expect(gteBinaryFixedPoint(q1_15('0.5'), q1_15('0.5'))).toBe(true);
        expect(gteBinaryFixedPoint(q1_15('0.75'), q1_15('0.5'))).toBe(true);
    });
});
