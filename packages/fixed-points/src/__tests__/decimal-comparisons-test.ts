import { SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, SolanaError } from '@solana/errors';

import {
    cmpDecimalFixedPoint,
    decimalFixedPoint,
    eqDecimalFixedPoint,
    gtDecimalFixedPoint,
    gteDecimalFixedPoint,
    ltDecimalFixedPoint,
    lteDecimalFixedPoint,
    rawDecimalFixedPoint,
} from '../decimal';

describe('cmpDecimalFixedPoint', () => {
    it('returns -1 when the first operand is smaller', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(cmpDecimalFixedPoint(usd('1.25'), usd('2.50'))).toBe(-1);
    });

    it('returns 0 when the two operands are equal', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(cmpDecimalFixedPoint(usd('2.50'), usd('2.50'))).toBe(0);
    });

    it('returns 1 when the first operand is greater', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(cmpDecimalFixedPoint(usd('3.75'), usd('2.50'))).toBe(1);
    });

    it('compares negative and positive signed values correctly', () => {
        const signed = decimalFixedPoint('signed', 64, 2);
        expect(cmpDecimalFixedPoint(signed('-2.50'), signed('2.50'))).toBe(-1);
        expect(cmpDecimalFixedPoint(signed('-2.50'), signed('-2.50'))).toBe(0);
        expect(cmpDecimalFixedPoint(signed('-1.25'), signed('-2.50'))).toBe(1);
    });

    it('treats zero as equal to zero', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(cmpDecimalFixedPoint(usd('0'), usd('0'))).toBe(0);
    });

    it('allows operands with different signedness', () => {
        const signed = rawDecimalFixedPoint('signed', 16, 2);
        const unsigned = rawDecimalFixedPoint('unsigned', 16, 2);
        expect(cmpDecimalFixedPoint(signed(-1n), unsigned(1n))).toBe(-1);
        expect(cmpDecimalFixedPoint(signed(1n), unsigned(1n))).toBe(0);
        expect(cmpDecimalFixedPoint(signed(2n), unsigned(1n))).toBe(1);
    });

    it('allows operands with different totalBits', () => {
        const small = rawDecimalFixedPoint('unsigned', 8, 2);
        const large = rawDecimalFixedPoint('unsigned', 32, 2);
        expect(cmpDecimalFixedPoint(small(100n), large(100n))).toBe(0);
        expect(cmpDecimalFixedPoint(small(100n), large(200n))).toBe(-1);
    });

    it('allows operands with different signedness and totalBits combined', () => {
        const signed8 = rawDecimalFixedPoint('signed', 8, 0);
        const unsigned32 = rawDecimalFixedPoint('unsigned', 32, 0);
        expect(cmpDecimalFixedPoint(signed8(5n), unsigned32(5n))).toBe(0);
    });

    it('throws SHAPE_MISMATCH when decimals differ', () => {
        const twoDecimals = rawDecimalFixedPoint('unsigned', 64, 2);
        const fourDecimals = rawDecimalFixedPoint('unsigned', 64, 4);
        expect(() =>
            // @ts-expect-error Operands must share the same decimals.
            cmpDecimalFixedPoint(twoDecimals(1n), fourDecimals(1n)),
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
                operation: 'cmpDecimalFixedPoint',
            }),
        );
    });

    it('throws SHAPE_MISMATCH when the second operand is not a fixed-point value', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(() =>
            // @ts-expect-error Second operand must be a DecimalFixedPoint.
            cmpDecimalFixedPoint(usd('2.50'), 42),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'unknown',
                actualScale: 0,
                actualScaleLabel: 'unknown',
                actualSignedness: 'unknown',
                actualTotalBits: 0,
                expectedKind: 'decimalFixedPoint',
                expectedScale: 2,
                expectedScaleLabel: 'decimals',
                expectedSignedness: 'unknown',
                expectedTotalBits: 0,
                operation: 'cmpDecimalFixedPoint',
            }),
        );
    });
});

describe('eqDecimalFixedPoint', () => {
    it('returns the expected boolean for less, equal, and greater', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(eqDecimalFixedPoint(usd('1.25'), usd('2.50'))).toBe(false);
        expect(eqDecimalFixedPoint(usd('2.50'), usd('2.50'))).toBe(true);
        expect(eqDecimalFixedPoint(usd('3.75'), usd('2.50'))).toBe(false);
    });
});

describe('ltDecimalFixedPoint', () => {
    it('returns the expected boolean for less, equal, and greater', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(ltDecimalFixedPoint(usd('1.25'), usd('2.50'))).toBe(true);
        expect(ltDecimalFixedPoint(usd('2.50'), usd('2.50'))).toBe(false);
        expect(ltDecimalFixedPoint(usd('3.75'), usd('2.50'))).toBe(false);
    });
});

describe('lteDecimalFixedPoint', () => {
    it('returns the expected boolean for less, equal, and greater', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(lteDecimalFixedPoint(usd('1.25'), usd('2.50'))).toBe(true);
        expect(lteDecimalFixedPoint(usd('2.50'), usd('2.50'))).toBe(true);
        expect(lteDecimalFixedPoint(usd('3.75'), usd('2.50'))).toBe(false);
    });
});

describe('gtDecimalFixedPoint', () => {
    it('returns the expected boolean for less, equal, and greater', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(gtDecimalFixedPoint(usd('1.25'), usd('2.50'))).toBe(false);
        expect(gtDecimalFixedPoint(usd('2.50'), usd('2.50'))).toBe(false);
        expect(gtDecimalFixedPoint(usd('3.75'), usd('2.50'))).toBe(true);
    });
});

describe('gteDecimalFixedPoint', () => {
    it('returns the expected boolean for less, equal, and greater', () => {
        const usd = decimalFixedPoint('unsigned', 64, 2);
        expect(gteDecimalFixedPoint(usd('1.25'), usd('2.50'))).toBe(false);
        expect(gteDecimalFixedPoint(usd('2.50'), usd('2.50'))).toBe(true);
        expect(gteDecimalFixedPoint(usd('3.75'), usd('2.50'))).toBe(true);
    });
});
