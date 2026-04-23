import {
    SOLANA_ERROR__FIXED_POINTS__MALFORMED_RAW_VALUE,
    SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH,
    SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import { binaryFixedPoint, rawBinaryFixedPoint } from '../binary/core';
import { assertIsBinaryFixedPoint, isBinaryFixedPoint } from '../binary/guards';

describe('isBinaryFixedPoint', () => {
    it('returns true for valid binary fixed-point values', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(isBinaryFixedPoint(q1_15('0.5'))).toBe(true);
        const unsigned = rawBinaryFixedPoint('unsigned', 8, 4);
        expect(isBinaryFixedPoint(unsigned(42n))).toBe(true);
    });

    it('returns false for non-objects and wrong kinds', () => {
        expect(isBinaryFixedPoint(42)).toBe(false);
        expect(isBinaryFixedPoint(null)).toBe(false);
        expect(isBinaryFixedPoint(undefined)).toBe(false);
        expect(isBinaryFixedPoint({})).toBe(false);
        expect(isBinaryFixedPoint({ kind: 'decimalFixedPoint' })).toBe(false);
    });

    it('returns false when required fields are missing or malformed', () => {
        const base = {
            fractionalBits: 15,
            kind: 'binaryFixedPoint',
            raw: 0n,
            signedness: 'signed',
            totalBits: 16,
        };
        expect(isBinaryFixedPoint({ ...base, signedness: 'weird' })).toBe(false);
        expect(isBinaryFixedPoint({ ...base, totalBits: 0 })).toBe(false);
        expect(isBinaryFixedPoint({ ...base, fractionalBits: -1 })).toBe(false);
        expect(isBinaryFixedPoint({ ...base, fractionalBits: 32 })).toBe(false); // exceeds totalBits
        expect(isBinaryFixedPoint({ ...base, raw: 1 })).toBe(false);
    });

    it('returns false when the raw value does not fit the claimed range', () => {
        expect(
            isBinaryFixedPoint({
                fractionalBits: 0,
                kind: 'binaryFixedPoint',
                raw: 128n,
                signedness: 'signed',
                totalBits: 8,
            }),
        ).toBe(false);
    });

    it('narrows to the specific shape when parameters are provided', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        const value = q1_15('0.5');
        expect(isBinaryFixedPoint(value, 'signed', 16, 15)).toBe(true);
        expect(isBinaryFixedPoint(value, 'unsigned', 16, 15)).toBe(false);
        expect(isBinaryFixedPoint(value, 'signed', 32, 15)).toBe(false);
        expect(isBinaryFixedPoint(value, 'signed', 16, 14)).toBe(false);
    });

    it('accepts partial positional arguments, constraining only the fields that are provided', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        const value = q1_15('0.5');
        expect(isBinaryFixedPoint(value, 'signed')).toBe(true);
        expect(isBinaryFixedPoint(value, 'unsigned')).toBe(false);
        expect(isBinaryFixedPoint(value, 'signed', 16)).toBe(true);
        expect(isBinaryFixedPoint(value, 'signed', 32)).toBe(false);
    });

    it('treats `undefined` as "don’t care" for any skipped field', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        const value = q1_15('0.5');
        expect(isBinaryFixedPoint(value, undefined, 16)).toBe(true);
        expect(isBinaryFixedPoint(value, undefined, undefined, 15)).toBe(true);
        expect(isBinaryFixedPoint(value, undefined, 32)).toBe(false);
    });
});

describe('assertIsBinaryFixedPoint', () => {
    it('passes silently for valid values', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(() => assertIsBinaryFixedPoint(q1_15('0.5'))).not.toThrow();
        expect(() => assertIsBinaryFixedPoint(q1_15('0.5'), 'signed', 16, 15)).not.toThrow();
    });

    it('throws SHAPE_MISMATCH for non-object inputs', () => {
        expect(() => assertIsBinaryFixedPoint(42)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'unknown',
                actualScale: 0,
                actualScaleLabel: 'unknown',
                actualSignedness: 'unknown',
                actualTotalBits: 0,
                expectedKind: 'binaryFixedPoint',
                expectedScale: 0,
                expectedScaleLabel: 'fractional bits',
                expectedSignedness: 'unknown',
                expectedTotalBits: 0,
                operation: 'assertIsBinaryFixedPoint',
            }),
        );
    });

    it('throws SHAPE_MISMATCH when the value is a decimal fixed-point', () => {
        expect(() => assertIsBinaryFixedPoint({ kind: 'decimalFixedPoint' })).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'decimalFixedPoint',
                actualScale: 0,
                actualScaleLabel: 'decimals',
                actualSignedness: 'unknown',
                actualTotalBits: 0,
                expectedKind: 'binaryFixedPoint',
                expectedScale: 0,
                expectedScaleLabel: 'fractional bits',
                expectedSignedness: 'unknown',
                expectedTotalBits: 0,
                operation: 'assertIsBinaryFixedPoint',
            }),
        );
    });

    it('throws SHAPE_MISMATCH when a binary value has the wrong signedness', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(() => assertIsBinaryFixedPoint(q1_15('0.5'), 'unsigned', 16, 15)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'binaryFixedPoint',
                actualScale: 15,
                actualScaleLabel: 'fractional bits',
                actualSignedness: 'signed',
                actualTotalBits: 16,
                expectedKind: 'binaryFixedPoint',
                expectedScale: 15,
                expectedScaleLabel: 'fractional bits',
                expectedSignedness: 'unsigned',
                expectedTotalBits: 16,
                operation: 'assertIsBinaryFixedPoint',
            }),
        );
    });

    it('throws VALUE_OUT_OF_RANGE when the raw value does not fit the claimed range', () => {
        const malformed = {
            fractionalBits: 0,
            kind: 'binaryFixedPoint' as const,
            raw: 128n,
            signedness: 'signed' as const,
            totalBits: 8,
        };
        expect(() => assertIsBinaryFixedPoint(malformed)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'binaryFixedPoint',
                max: 127n,
                min: -128n,
                raw: 128n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });

    it('throws MALFORMED_RAW_VALUE when the raw field is not a bigint', () => {
        const malformed = {
            fractionalBits: 15,
            kind: 'binaryFixedPoint' as const,
            raw: 42,
            signedness: 'signed' as const,
            totalBits: 16,
        };
        expect(() => assertIsBinaryFixedPoint(malformed)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__MALFORMED_RAW_VALUE, {
                kind: 'binaryFixedPoint',
                raw: 42,
            }),
        );
    });
});
