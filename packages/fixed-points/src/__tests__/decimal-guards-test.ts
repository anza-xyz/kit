import {
    SOLANA_ERROR__FIXED_POINTS__MALFORMED_RAW_VALUE,
    SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH,
    SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import { decimalFixedPoint, rawDecimalFixedPoint } from '../decimal/core';
import { assertIsDecimalFixedPoint, isDecimalFixedPoint } from '../decimal/guards';

describe('isDecimalFixedPoint', () => {
    it('returns true for valid decimal fixed-point values', () => {
        const usdc = decimalFixedPoint('unsigned', 64, 6);
        expect(isDecimalFixedPoint(usdc('1.5'))).toBe(true);
        expect(isDecimalFixedPoint(usdc('0'))).toBe(true);
        const signed = rawDecimalFixedPoint('signed', 8, 2);
        expect(isDecimalFixedPoint(signed(-128n))).toBe(true);
    });

    it('returns false for non-objects and wrong kinds', () => {
        expect(isDecimalFixedPoint(42)).toBe(false);
        expect(isDecimalFixedPoint('1.5')).toBe(false);
        expect(isDecimalFixedPoint(null)).toBe(false);
        expect(isDecimalFixedPoint(undefined)).toBe(false);
        expect(isDecimalFixedPoint({})).toBe(false);
        expect(isDecimalFixedPoint({ kind: 'binaryFixedPoint' })).toBe(false);
    });

    it('returns false when required fields are missing or malformed', () => {
        const base = {
            decimals: 6,
            kind: 'decimalFixedPoint',
            raw: 0n,
            signedness: 'unsigned',
            totalBits: 64,
        };
        expect(isDecimalFixedPoint({ ...base, signedness: 'weird' })).toBe(false);
        expect(isDecimalFixedPoint({ ...base, totalBits: -1 })).toBe(false);
        expect(isDecimalFixedPoint({ ...base, totalBits: 1.5 })).toBe(false);
        expect(isDecimalFixedPoint({ ...base, decimals: -1 })).toBe(false);
        expect(isDecimalFixedPoint({ ...base, raw: 1 })).toBe(false); // number instead of bigint
    });

    it('returns false when the raw value does not fit the claimed range', () => {
        expect(
            isDecimalFixedPoint({
                decimals: 0,
                kind: 'decimalFixedPoint',
                raw: 256n,
                signedness: 'unsigned',
                totalBits: 8,
            }),
        ).toBe(false);
    });

    it('narrows to the specific shape when parameters are provided', () => {
        const usdc = decimalFixedPoint('unsigned', 64, 6);
        const value = usdc('1.5');
        expect(isDecimalFixedPoint(value, 'unsigned', 64, 6)).toBe(true);
        expect(isDecimalFixedPoint(value, 'signed', 64, 6)).toBe(false);
        expect(isDecimalFixedPoint(value, 'unsigned', 32, 6)).toBe(false);
        expect(isDecimalFixedPoint(value, 'unsigned', 64, 9)).toBe(false);
    });

    it('accepts partial positional arguments, constraining only the fields that are provided', () => {
        const usdc = decimalFixedPoint('unsigned', 64, 6);
        const value = usdc('1.5');
        expect(isDecimalFixedPoint(value, 'unsigned')).toBe(true);
        expect(isDecimalFixedPoint(value, 'signed')).toBe(false);
        expect(isDecimalFixedPoint(value, 'unsigned', 64)).toBe(true);
        expect(isDecimalFixedPoint(value, 'unsigned', 32)).toBe(false);
    });

    it('treats `undefined` as "don’t care" for any skipped field', () => {
        const usdc = decimalFixedPoint('unsigned', 64, 6);
        const value = usdc('1.5');
        expect(isDecimalFixedPoint(value, undefined, 64)).toBe(true);
        expect(isDecimalFixedPoint(value, undefined, undefined, 6)).toBe(true);
        expect(isDecimalFixedPoint(value, undefined, 32)).toBe(false);
    });
});

describe('assertIsDecimalFixedPoint', () => {
    it('passes silently for valid values', () => {
        const usdc = decimalFixedPoint('unsigned', 64, 6);
        expect(() => assertIsDecimalFixedPoint(usdc('1.5'))).not.toThrow();
        expect(() => assertIsDecimalFixedPoint(usdc('1.5'), 'unsigned', 64, 6)).not.toThrow();
    });

    it('throws SHAPE_MISMATCH for non-object inputs', () => {
        expect(() => assertIsDecimalFixedPoint(42)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'unknown',
                actualScale: 0,
                actualScaleLabel: 'unknown',
                actualSignedness: 'unknown',
                actualTotalBits: 0,
                expectedKind: 'decimalFixedPoint',
                expectedScale: 0,
                expectedScaleLabel: 'decimals',
                expectedSignedness: 'unknown',
                expectedTotalBits: 0,
                operation: 'assertIsDecimalFixedPoint',
            }),
        );
    });

    it('throws SHAPE_MISMATCH when the value is a binary fixed-point', () => {
        expect(() => assertIsDecimalFixedPoint({ kind: 'binaryFixedPoint' })).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'binaryFixedPoint',
                actualScale: 0,
                actualScaleLabel: 'fractional bits',
                actualSignedness: 'unknown',
                actualTotalBits: 0,
                expectedKind: 'decimalFixedPoint',
                expectedScale: 0,
                expectedScaleLabel: 'decimals',
                expectedSignedness: 'unknown',
                expectedTotalBits: 0,
                operation: 'assertIsDecimalFixedPoint',
            }),
        );
    });

    it('throws SHAPE_MISMATCH when a decimal value has the wrong totalBits', () => {
        const usdc = decimalFixedPoint('unsigned', 64, 6);
        expect(() => assertIsDecimalFixedPoint(usdc('1.5'), 'unsigned', 32, 6)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'decimalFixedPoint',
                actualScale: 6,
                actualScaleLabel: 'decimals',
                actualSignedness: 'unsigned',
                actualTotalBits: 64,
                expectedKind: 'decimalFixedPoint',
                expectedScale: 6,
                expectedScaleLabel: 'decimals',
                expectedSignedness: 'unsigned',
                expectedTotalBits: 32,
                operation: 'assertIsDecimalFixedPoint',
            }),
        );
    });

    it('throws VALUE_OUT_OF_RANGE when the raw value does not fit the claimed range', () => {
        const malformed = {
            decimals: 0,
            kind: 'decimalFixedPoint' as const,
            raw: 256n,
            signedness: 'unsigned' as const,
            totalBits: 8,
        };
        expect(() => assertIsDecimalFixedPoint(malformed)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'decimalFixedPoint',
                max: 255n,
                min: 0n,
                raw: 256n,
                signedness: 'unsigned',
                totalBits: 8,
            }),
        );
    });

    it('throws MALFORMED_RAW_VALUE when the raw field is not a bigint', () => {
        const malformed = {
            decimals: 6,
            kind: 'decimalFixedPoint' as const,
            raw: 42,
            signedness: 'unsigned' as const,
            totalBits: 64,
        };
        expect(() => assertIsDecimalFixedPoint(malformed)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__MALFORMED_RAW_VALUE, {
                kind: 'decimalFixedPoint',
                raw: 42,
            }),
        );
    });
});
