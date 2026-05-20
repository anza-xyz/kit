import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW,
    SOLANA_ERROR__FIXED_POINTS__DIVISION_BY_ZERO,
    SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH,
    SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS,
    SolanaError,
} from '@solana/errors';

import {
    absoluteBinaryFixedPoint,
    addBinaryFixedPoint,
    binaryFixedPoint,
    divideBinaryFixedPoint,
    multiplyBinaryFixedPoint,
    negateBinaryFixedPoint,
    rawBinaryFixedPoint,
    subtractBinaryFixedPoint,
} from '../binary';

describe('addBinaryFixedPoint', () => {
    it('adds two values of the same shape', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(addBinaryFixedPoint(q1_15('0.25'), q1_15('0.5')).raw).toBe(2n ** 13n + 2n ** 14n);
    });

    it('returns a frozen value', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(addBinaryFixedPoint(q1_15('0.25'), q1_15('0.5'))).toBeFrozenObject();
    });

    it('throws SHAPE_MISMATCH when the operands have different shapes', () => {
        const q1_15 = rawBinaryFixedPoint('signed', 16, 15);
        const q8_8 = rawBinaryFixedPoint('signed', 16, 8);
        expect(() =>
            // @ts-expect-error Operands must share the same shape.
            addBinaryFixedPoint(q1_15(1n), q8_8(1n)),
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
                operation: 'addBinaryFixedPoint',
            }),
        );
    });

    it('throws ARITHMETIC_OVERFLOW when the sum exceeds the upper bound', () => {
        const factory = rawBinaryFixedPoint('signed', 8, 0);
        expect(() => addBinaryFixedPoint(factory(100n), factory(50n))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'binaryFixedPoint',
                max: 127n,
                min: -128n,
                operation: 'add',
                result: 150n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });
});

describe('subtractBinaryFixedPoint', () => {
    it('subtracts two values of the same shape', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(subtractBinaryFixedPoint(q1_15('0.75'), q1_15('0.5')).raw).toBe(2n ** 13n);
    });

    it('returns a frozen value', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(subtractBinaryFixedPoint(q1_15('0.75'), q1_15('0.5'))).toBeFrozenObject();
    });

    it('throws ARITHMETIC_OVERFLOW when the difference is below the lower bound', () => {
        const factory = rawBinaryFixedPoint('unsigned', 8, 0);
        expect(() => subtractBinaryFixedPoint(factory(1n), factory(2n))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'binaryFixedPoint',
                max: 255n,
                min: 0n,
                operation: 'subtract',
                result: -1n,
                signedness: 'unsigned',
                totalBits: 8,
            }),
        );
    });
});

describe('multiplyBinaryFixedPoint', () => {
    it('multiplies two values of the same shape', () => {
        // 0.5 × 0.5 = 0.25 at Q1.15 → raw = 2^13
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(multiplyBinaryFixedPoint(q1_15('0.5'), q1_15('0.5')).raw).toBe(2n ** 13n);
    });

    it('multiplies by a fixed-point operand with a different totalBits and fractionalBits', () => {
        // 0.5 (raw 16384 at 15 fractional bits) × 0.25 (raw 4 at 4 fractional bits)
        // rescales back to 15 fractional bits: (16384 × 4) / 2^4 = 65536 / 16 = 4096 = 2^12.
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        const q4_4 = rawBinaryFixedPoint('signed', 8, 4);
        expect(multiplyBinaryFixedPoint(q1_15('0.5'), q4_4(4n)).raw).toBe(2n ** 12n);
    });

    it('multiplies by a bigint scalar', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(multiplyBinaryFixedPoint(q1_15('0.25'), 2n).raw).toBe(2n ** 14n);
        expect(multiplyBinaryFixedPoint(q1_15('0.25'), -2n).raw).toBe(-(2n ** 14n));
    });

    it('returns a frozen value', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(multiplyBinaryFixedPoint(q1_15('0.25'), 2n)).toBeFrozenObject();
    });

    it('throws STRICT_MODE_PRECISION_LOSS under the default rounding when the product is inexact', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        // 1/3 × 1/3 in Q1.15 requires rounding.
        expect(() => multiplyBinaryFixedPoint(q1_15('0.25'), rawBinaryFixedPoint('signed', 16, 15)(1n))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'binaryFixedPoint',
                operation: 'multiply',
            }),
        );
    });

    it('rounds an inexact product when a non-strict rounding mode is supplied', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        const tiny = rawBinaryFixedPoint('signed', 16, 15)(1n);
        expect(multiplyBinaryFixedPoint(q1_15('0.25'), tiny, 'floor').raw).toBe(0n);
        expect(multiplyBinaryFixedPoint(q1_15('0.25'), tiny, 'ceil').raw).toBe(1n);
    });

    it('throws SHAPE_MISMATCH when the fixed-point operand has a different signedness', () => {
        const signed = binaryFixedPoint('signed', 16, 15);
        const unsigned = rawBinaryFixedPoint('unsigned', 16, 15);
        expect(() =>
            // @ts-expect-error Second operand must share the first operand's signedness.
            multiplyBinaryFixedPoint(signed('0.25'), unsigned(1n)),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'binaryFixedPoint',
                actualScale: 15,
                actualScaleLabel: 'fractional bits',
                actualSignedness: 'unsigned',
                actualTotalBits: 16,
                expectedKind: 'binaryFixedPoint',
                expectedScale: 15,
                expectedScaleLabel: 'fractional bits',
                expectedSignedness: 'signed',
                expectedTotalBits: 16,
                operation: 'multiplyBinaryFixedPoint',
            }),
        );
    });

    it('throws ARITHMETIC_OVERFLOW when the product does not fit the target shape', () => {
        const int8 = rawBinaryFixedPoint('signed', 8, 0);
        expect(() => multiplyBinaryFixedPoint(int8(100n), 2n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'binaryFixedPoint',
                max: 127n,
                min: -128n,
                operation: 'multiply',
                result: 200n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });
});

describe('divideBinaryFixedPoint', () => {
    it('divides by a fixed-point operand of the same shape', () => {
        // 0.5 ÷ 0.25 = 2.0; 3 integer bits provide enough headroom for the result.
        const q3_13 = binaryFixedPoint('signed', 16, 13);
        expect(divideBinaryFixedPoint(q3_13('0.5'), q3_13('0.25')).raw).toBe(2n ** 14n);
    });

    it('divides by a fixed-point operand with a different totalBits and fractionalBits', () => {
        // 0.5 (raw 4096 at 13 fractional bits) ÷ 0.25 (raw 4 at 4 fractional bits)
        // rescales back to 13 fractional bits: (4096 × 2^4) / 4 = 65536 / 4 = 16384.
        const q3_13 = binaryFixedPoint('signed', 16, 13);
        const q4_4 = rawBinaryFixedPoint('signed', 8, 4);
        expect(divideBinaryFixedPoint(q3_13('0.5'), q4_4(4n)).raw).toBe(2n ** 14n);
    });

    it('divides by a bigint scalar', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(divideBinaryFixedPoint(q1_15('0.5'), 2n).raw).toBe(2n ** 13n);
    });

    it('returns a frozen value', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(divideBinaryFixedPoint(q1_15('0.5'), 2n)).toBeFrozenObject();
    });

    it('throws STRICT_MODE_PRECISION_LOSS under the default rounding when the division is inexact', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(() => divideBinaryFixedPoint(q1_15('0.5'), 3n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'binaryFixedPoint',
                operation: 'divide',
            }),
        );
    });

    it('rounds an inexact division when a non-strict rounding mode is supplied', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        // 16384 / 3 = 5461.33…
        expect(divideBinaryFixedPoint(q1_15('0.5'), 3n, 'floor').raw).toBe(5461n);
        expect(divideBinaryFixedPoint(q1_15('0.5'), 3n, 'ceil').raw).toBe(5462n);
    });

    it('throws DIVISION_BY_ZERO when dividing by a bigint zero', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(() => divideBinaryFixedPoint(q1_15('0.5'), 0n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__DIVISION_BY_ZERO, {
                kind: 'binaryFixedPoint',
                signedness: 'signed',
                totalBits: 16,
            }),
        );
    });

    it('throws DIVISION_BY_ZERO when dividing by a fixed-point zero', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(() => divideBinaryFixedPoint(q1_15('0.5'), q1_15('0'))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__DIVISION_BY_ZERO, {
                kind: 'binaryFixedPoint',
                signedness: 'signed',
                totalBits: 16,
            }),
        );
    });

    it('throws ARITHMETIC_OVERFLOW when the quotient does not fit the target shape', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(() => divideBinaryFixedPoint(q1_15('0.5'), q1_15('0.25'))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'binaryFixedPoint',
                max: 32767n,
                min: -32768n,
                operation: 'divide',
                result: 65536n,
                signedness: 'signed',
                totalBits: 16,
            }),
        );
    });
});

describe('negateBinaryFixedPoint', () => {
    it('negates a signed value', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(negateBinaryFixedPoint(q1_15('0.5')).raw).toBe(-(2n ** 14n));
        expect(negateBinaryFixedPoint(q1_15('-0.5')).raw).toBe(2n ** 14n);
    });

    it('returns a frozen value', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(negateBinaryFixedPoint(q1_15('0.5'))).toBeFrozenObject();
    });

    it('throws ARITHMETIC_OVERFLOW when negating the minimum signed value', () => {
        const factory = rawBinaryFixedPoint('signed', 8, 0);
        expect(() => negateBinaryFixedPoint(factory(-128n))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'binaryFixedPoint',
                max: 127n,
                min: -128n,
                operation: 'negate',
                result: 128n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });

    it('throws SHAPE_MISMATCH when called on an unsigned value at runtime', () => {
        const unsigned = rawBinaryFixedPoint('unsigned', 16, 15)(1n);
        expect(() =>
            // @ts-expect-error Only signed values can be negated.
            negateBinaryFixedPoint(unsigned),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'binaryFixedPoint',
                actualScale: 15,
                actualScaleLabel: 'fractional bits',
                actualSignedness: 'unsigned',
                actualTotalBits: 16,
                expectedKind: 'binaryFixedPoint',
                expectedScale: 15,
                expectedScaleLabel: 'fractional bits',
                expectedSignedness: 'signed',
                expectedTotalBits: 16,
                operation: 'negateBinaryFixedPoint',
            }),
        );
    });
});

describe('absoluteBinaryFixedPoint', () => {
    it('returns the absolute value of a signed negative', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(absoluteBinaryFixedPoint(q1_15('-0.5')).raw).toBe(2n ** 14n);
    });

    it('returns the signed positive unchanged', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(absoluteBinaryFixedPoint(q1_15('0.5')).raw).toBe(2n ** 14n);
    });

    it('returns the unsigned input unchanged', () => {
        const unsigned = binaryFixedPoint('unsigned', 16, 15);
        expect(absoluteBinaryFixedPoint(unsigned('0.5')).raw).toBe(2n ** 14n);
    });

    it('returns a frozen value', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(absoluteBinaryFixedPoint(q1_15('-0.5'))).toBeFrozenObject();
    });

    it('throws ARITHMETIC_OVERFLOW on the minimum signed value', () => {
        const factory = rawBinaryFixedPoint('signed', 8, 0);
        expect(() => absoluteBinaryFixedPoint(factory(-128n))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'binaryFixedPoint',
                max: 127n,
                min: -128n,
                operation: 'absolute',
                result: 128n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });
});
