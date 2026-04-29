import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW,
    SOLANA_ERROR__FIXED_POINTS__DIVISION_BY_ZERO,
    SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH,
    SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS,
    SolanaError,
} from '@solana/errors';

import {
    absoluteDecimalFixedPoint,
    addDecimalFixedPoint,
    decimalFixedPoint,
    divideDecimalFixedPoint,
    multiplyDecimalFixedPoint,
    negateDecimalFixedPoint,
    rawDecimalFixedPoint,
    subtractDecimalFixedPoint,
} from '../decimal';

describe('addDecimalFixedPoint', () => {
    it('adds two values of the same shape', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(addDecimalFixedPoint(usd('1.50'), usd('2.25')).raw).toBe(375n);
    });

    it('returns a frozen value', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(addDecimalFixedPoint(usd('1.50'), usd('2.25'))).toBeFrozenObject();
    });

    it('throws SHAPE_MISMATCH when the operands have different decimals', () => {
        const usd = rawDecimalFixedPoint('unsigned', 64, 2);
        const rate = rawDecimalFixedPoint('unsigned', 64, 4);
        expect(() =>
            // @ts-expect-error Operands must share the same shape.
            addDecimalFixedPoint(usd(1n), rate(1n)),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'decimalFixedPoint',
                actualScale: 4,
                actualScaleLabel: 'decimals',
                actualSignedness: 'unsigned',
                actualTotalBits: 64,
                expectedKind: 'decimalFixedPoint',
                expectedScale: 2,
                expectedScaleLabel: 'decimals',
                expectedSignedness: 'unsigned',
                expectedTotalBits: 64,
                operation: 'addDecimalFixedPoint',
            }),
        );
    });

    it('throws ARITHMETIC_OVERFLOW when the sum exceeds the upper bound', () => {
        const factory = rawDecimalFixedPoint('unsigned', 8, 0);
        expect(() => addDecimalFixedPoint(factory(200n), factory(100n))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'decimalFixedPoint',
                max: 255n,
                min: 0n,
                operation: 'add',
                result: 300n,
                signedness: 'unsigned',
                totalBits: 8,
            }),
        );
    });
});

describe('subtractDecimalFixedPoint', () => {
    it('subtracts two values of the same shape', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(subtractDecimalFixedPoint(usd('10'), usd('3.5')).raw).toBe(650n);
    });

    it('returns a frozen value', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(subtractDecimalFixedPoint(usd('10'), usd('3.5'))).toBeFrozenObject();
    });

    it('throws ARITHMETIC_OVERFLOW when the difference is below the lower bound', () => {
        const factory = rawDecimalFixedPoint('unsigned', 8, 0);
        expect(() => subtractDecimalFixedPoint(factory(1n), factory(2n))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'decimalFixedPoint',
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

describe('multiplyDecimalFixedPoint', () => {
    it('multiplies two values of the same shape', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        // 1.50 × 2.00 = 3.00 → raw 300n
        expect(multiplyDecimalFixedPoint(usd('1.50'), usd('2.00')).raw).toBe(300n);
    });

    it('multiplies by a fixed-point operand with a different totalBits and decimals', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        const rate = decimalFixedPoint('unsigned', 32, 4);
        // 100.00 × 0.0025 = 0.25 → raw 25n at 2 decimals
        expect(multiplyDecimalFixedPoint(usd('100'), rate('0.0025')).raw).toBe(25n);
    });

    it('multiplies by a bigint scalar', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(multiplyDecimalFixedPoint(usd('1.50'), 3n).raw).toBe(450n);
    });

    it('returns a frozen value', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(multiplyDecimalFixedPoint(usd('1.50'), 3n)).toBeFrozenObject();
    });

    it('throws STRICT_MODE_PRECISION_LOSS under the default rounding when the product is inexact', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        const rate = rawDecimalFixedPoint('unsigned', 64, 4);
        // 100n × 1n / 10000 = 0.01 at 2 decimals is inexact (0.0001 precision lost).
        expect(() => multiplyDecimalFixedPoint(usd('1'), rate(1n))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'decimalFixedPoint',
                operation: 'multiply',
            }),
        );
    });

    it('rounds an inexact product when a non-strict rounding mode is supplied', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        const rate = rawDecimalFixedPoint('unsigned', 64, 4);
        // 100n × 1n / 10000 = 0.01, floor → 0
        expect(multiplyDecimalFixedPoint(usd('1'), rate(1n), 'floor').raw).toBe(0n);
        expect(multiplyDecimalFixedPoint(usd('1'), rate(1n), 'ceil').raw).toBe(1n);
    });

    it('throws SHAPE_MISMATCH when the fixed-point operand has a different signedness', () => {
        const signed = decimalFixedPoint('signed', 64, 2);
        const unsigned = rawDecimalFixedPoint('unsigned', 64, 2);
        expect(() =>
            // @ts-expect-error Second operand must share the first operand's signedness.
            multiplyDecimalFixedPoint(signed('1'), unsigned(1n)),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'decimalFixedPoint',
                actualScale: 2,
                actualScaleLabel: 'decimals',
                actualSignedness: 'unsigned',
                actualTotalBits: 64,
                expectedKind: 'decimalFixedPoint',
                expectedScale: 2,
                expectedScaleLabel: 'decimals',
                expectedSignedness: 'signed',
                expectedTotalBits: 64,
                operation: 'multiplyDecimalFixedPoint',
            }),
        );
    });

    it('throws ARITHMETIC_OVERFLOW when the product does not fit the target shape', () => {
        const tiny = rawDecimalFixedPoint('unsigned', 8, 0);
        expect(() => multiplyDecimalFixedPoint(tiny(100n), 3n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'decimalFixedPoint',
                max: 255n,
                min: 0n,
                operation: 'multiply',
                result: 300n,
                signedness: 'unsigned',
                totalBits: 8,
            }),
        );
    });
});

describe('divideDecimalFixedPoint', () => {
    it('divides by a fixed-point operand of the same shape', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        // 10.00 ÷ 5.00 = 2.00 → raw 200n
        expect(divideDecimalFixedPoint(usd('10'), usd('5')).raw).toBe(200n);
    });

    it('divides by a fixed-point operand with a different totalBits and decimals', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        const rate = decimalFixedPoint('unsigned', 32, 4);
        // 10.00 ÷ 0.05 = 200.00 → raw 20000n at 2 decimals
        expect(divideDecimalFixedPoint(usd('10'), rate('0.05')).raw).toBe(20000n);
    });

    it('divides by a bigint scalar', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(divideDecimalFixedPoint(usd('10.50'), 3n, 'round').raw).toBe(350n);
    });

    it('returns a frozen value', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(divideDecimalFixedPoint(usd('10'), 2n)).toBeFrozenObject();
    });

    it('throws STRICT_MODE_PRECISION_LOSS under the default rounding when the division is inexact', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(() => divideDecimalFixedPoint(usd('10'), 3n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'decimalFixedPoint',
                operation: 'divide',
            }),
        );
    });

    it('rounds an inexact division when a non-strict rounding mode is supplied', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        // 1000 / 3 = 333.33…
        expect(divideDecimalFixedPoint(usd('10'), 3n, 'floor').raw).toBe(333n);
        expect(divideDecimalFixedPoint(usd('10'), 3n, 'ceil').raw).toBe(334n);
        expect(divideDecimalFixedPoint(usd('10'), 3n, 'round').raw).toBe(333n);
    });

    it('throws DIVISION_BY_ZERO when dividing by a bigint zero', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(() => divideDecimalFixedPoint(usd('10'), 0n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__DIVISION_BY_ZERO, {
                kind: 'decimalFixedPoint',
                signedness: 'unsigned',
                totalBits: 64,
            }),
        );
    });

    it('throws DIVISION_BY_ZERO when dividing by a fixed-point zero', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(() => divideDecimalFixedPoint(usd('10'), usd('0'))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__DIVISION_BY_ZERO, {
                kind: 'decimalFixedPoint',
                signedness: 'unsigned',
                totalBits: 64,
            }),
        );
    });

    it('throws ARITHMETIC_OVERFLOW when the quotient does not fit the target shape', () => {
        const tiny = rawDecimalFixedPoint('unsigned', 8, 0);
        const rate = decimalFixedPoint('unsigned', 64, 4);
        expect(() => divideDecimalFixedPoint(tiny(100n), rate('0.1'))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'decimalFixedPoint',
                max: 255n,
                min: 0n,
                operation: 'divide',
                result: 1000n,
                signedness: 'unsigned',
                totalBits: 8,
            }),
        );
    });
});

describe('negateDecimalFixedPoint', () => {
    it('negates a signed value', () => {
        const signed = decimalFixedPoint('signed', 32, 2);
        expect(negateDecimalFixedPoint(signed('1.5')).raw).toBe(-150n);
        expect(negateDecimalFixedPoint(signed('-1.5')).raw).toBe(150n);
    });

    it('returns a frozen value', () => {
        const signed = decimalFixedPoint('signed', 32, 2);
        expect(negateDecimalFixedPoint(signed('1.5'))).toBeFrozenObject();
    });

    it('throws ARITHMETIC_OVERFLOW when negating the minimum signed value', () => {
        const factory = rawDecimalFixedPoint('signed', 8, 0);
        expect(() => negateDecimalFixedPoint(factory(-128n))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'decimalFixedPoint',
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
        const unsigned = rawDecimalFixedPoint('unsigned', 64, 6)(1n);
        expect(() =>
            // @ts-expect-error Only signed values can be negated.
            negateDecimalFixedPoint(unsigned),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'decimalFixedPoint',
                actualScale: 6,
                actualScaleLabel: 'decimals',
                actualSignedness: 'unsigned',
                actualTotalBits: 64,
                expectedKind: 'decimalFixedPoint',
                expectedScale: 6,
                expectedScaleLabel: 'decimals',
                expectedSignedness: 'signed',
                expectedTotalBits: 64,
                operation: 'negateDecimalFixedPoint',
            }),
        );
    });
});

describe('absoluteDecimalFixedPoint', () => {
    it('returns the absolute value of a signed negative', () => {
        const signed = decimalFixedPoint('signed', 32, 2);
        expect(absoluteDecimalFixedPoint(signed('-1.5')).raw).toBe(150n);
    });

    it('returns the signed positive unchanged', () => {
        const signed = decimalFixedPoint('signed', 32, 2);
        expect(absoluteDecimalFixedPoint(signed('1.5')).raw).toBe(150n);
    });

    it('returns the unsigned input unchanged', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(absoluteDecimalFixedPoint(usd('1.5')).raw).toBe(150n);
    });

    it('returns a frozen value', () => {
        const signed = decimalFixedPoint('signed', 32, 2);
        expect(absoluteDecimalFixedPoint(signed('-1.5'))).toBeFrozenObject();
    });

    it('throws ARITHMETIC_OVERFLOW on the minimum signed value', () => {
        const factory = rawDecimalFixedPoint('signed', 8, 0);
        expect(() => absoluteDecimalFixedPoint(factory(-128n))).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
                kind: 'decimalFixedPoint',
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
