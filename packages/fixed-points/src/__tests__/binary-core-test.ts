import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_FRACTIONAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_STRING,
    SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_ZERO_DENOMINATOR_RATIO,
    SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS,
    SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import { binaryFixedPoint, ratioBinaryFixedPoint, rawBinaryFixedPoint } from '../binary/core';

describe('binaryFixedPoint', () => {
    it('constructs values from decimal strings that are exactly representable in binary', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(q1_15('0').raw).toBe(0n);
        expect(q1_15('0.5').raw).toBe(2n ** 14n);
        expect(q1_15('0.25').raw).toBe(2n ** 13n);
        expect(q1_15('-0.5').raw).toBe(-(2n ** 14n));
    });

    it('returns values whose fields match the shape and kind', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(q1_15('0.5')).toEqual({
            fractionalBits: 15,
            kind: 'binaryFixedPoint',
            raw: 2n ** 14n,
            signedness: 'signed',
            totalBits: 16,
        });
    });

    it('returns frozen values', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(q1_15('0.5')).toBeFrozenObject();
    });

    it('throws STRICT_MODE_PRECISION_LOSS under the default rounding when the string cannot be represented exactly in binary', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(() => q1_15('0.1')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'binaryFixedPoint',
                operation: 'fromString',
            }),
        );
    });

    it('rounds inexact strings when a non-strict rounding mode is supplied', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        // 0.1 × 2^15 = 3276.8
        expect(q1_15('0.1', 'floor').raw).toBe(3276n);
        expect(q1_15('0.1', 'ceil').raw).toBe(3277n);
        expect(q1_15('0.1', 'round').raw).toBe(3277n);
        expect(q1_15('0.1', 'trunc').raw).toBe(3276n);
    });

    it('throws VALUE_OUT_OF_RANGE when the result does not fit the target shape', () => {
        // 1 × 2^7 = 128, which overflows a signed 8-bit range [-128, 127].
        const q1_7 = binaryFixedPoint('signed', 8, 7);
        expect(() => q1_7('1')).toThrow(
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

    it('accepts the largest representable value for a given shape', () => {
        // 0.9921875 = 127/128, the largest value representable as signed Q1.7.
        const q1_7 = binaryFixedPoint('signed', 8, 7);
        expect(q1_7('0.9921875').raw).toBe(127n);
    });

    it('throws INVALID_STRING on malformed inputs', () => {
        const q1_15 = binaryFixedPoint('signed', 16, 15);
        expect(() => q1_15('abc')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_STRING, {
                input: 'abc',
                kind: 'binaryFixedPoint',
            }),
        );
    });

    it('throws INVALID_TOTAL_BITS when totalBits is not a positive integer', () => {
        expect(() => binaryFixedPoint('signed', 0, 0)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS, {
                kind: 'binaryFixedPoint',
                totalBits: 0,
            }),
        );
    });

    it('throws INVALID_FRACTIONAL_BITS when fractionalBits is not a non-negative integer', () => {
        expect(() => binaryFixedPoint('signed', 16, -1)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_FRACTIONAL_BITS, { fractionalBits: -1 }),
        );
    });

    it('throws FRACTIONAL_BITS_EXCEED_TOTAL_BITS when fractionalBits exceeds totalBits', () => {
        expect(() => binaryFixedPoint('signed', 16, 32)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS, {
                fractionalBits: 32,
                totalBits: 16,
            }),
        );
    });

    it('allows fractionalBits equal to totalBits', () => {
        // Q0.16 can represent values in [0, 1), so `0` fits and proves the
        // factory was accepted even at the fractionalBits=totalBits boundary.
        const factory = binaryFixedPoint('unsigned', 16, 16);
        expect(factory('0').raw).toBe(0n);
    });
});

describe('rawBinaryFixedPoint', () => {
    it('constructs values directly from a raw bigint', () => {
        const q1_15 = rawBinaryFixedPoint('signed', 16, 15);
        expect(q1_15(2n ** 14n)).toEqual({
            fractionalBits: 15,
            kind: 'binaryFixedPoint',
            raw: 2n ** 14n,
            signedness: 'signed',
            totalBits: 16,
        });
    });

    it('returns frozen values', () => {
        const q1_15 = rawBinaryFixedPoint('signed', 16, 15);
        expect(q1_15(2n ** 14n)).toBeFrozenObject();
    });

    it('throws VALUE_OUT_OF_RANGE when the raw value does not fit the shape', () => {
        const q1_7 = rawBinaryFixedPoint('signed', 8, 7);
        expect(() => q1_7(128n)).toThrow(
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
});

describe('ratioBinaryFixedPoint', () => {
    it('constructs values from exact ratios', () => {
        const q1_15 = ratioBinaryFixedPoint('signed', 16, 15);
        // 0.25 × 2^15
        expect(q1_15(1n, 4n).raw).toBe(2n ** 13n);
        // 0.5 × 2^15
        expect(q1_15(1n, 2n).raw).toBe(2n ** 14n);
    });

    it('returns frozen values', () => {
        const q1_15 = ratioBinaryFixedPoint('signed', 16, 15);
        expect(q1_15(1n, 4n)).toBeFrozenObject();
    });

    it('throws STRICT_MODE_PRECISION_LOSS under the default rounding when the ratio is inexact', () => {
        const q1_15 = ratioBinaryFixedPoint('signed', 16, 15);
        expect(() => q1_15(1n, 3n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'binaryFixedPoint',
                operation: 'fromRatio',
            }),
        );
    });

    it('rounds inexact ratios when a non-strict rounding mode is supplied', () => {
        const q1_15 = ratioBinaryFixedPoint('signed', 16, 15);
        // 1/3 × 2^15 = 10922.666…
        expect(q1_15(1n, 3n, 'floor').raw).toBe(10922n);
        expect(q1_15(1n, 3n, 'ceil').raw).toBe(10923n);
        expect(q1_15(1n, 3n, 'round').raw).toBe(10923n);
    });

    it('throws INVALID_ZERO_DENOMINATOR_RATIO when the denominator is zero', () => {
        const q1_15 = ratioBinaryFixedPoint('signed', 16, 15);
        expect(() => q1_15(1n, 0n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_ZERO_DENOMINATOR_RATIO, {
                denominator: 0n,
                kind: 'binaryFixedPoint',
                numerator: 1n,
            }),
        );
    });
});

describe('binary factory shape validation', () => {
    it('rejects zero totalBits up front from every binary factory', () => {
        for (const factory of [binaryFixedPoint, rawBinaryFixedPoint, ratioBinaryFixedPoint]) {
            expect(() => factory('signed', 0, 0)).toThrow(
                new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS, {
                    kind: 'binaryFixedPoint',
                    totalBits: 0,
                }),
            );
        }
    });

    it('rejects negative fractionalBits up front from every binary factory', () => {
        for (const factory of [binaryFixedPoint, rawBinaryFixedPoint, ratioBinaryFixedPoint]) {
            expect(() => factory('signed', 16, -1)).toThrow(
                new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_FRACTIONAL_BITS, { fractionalBits: -1 }),
            );
        }
    });

    it('rejects fractionalBits that exceed totalBits up front from every binary factory', () => {
        for (const factory of [binaryFixedPoint, rawBinaryFixedPoint, ratioBinaryFixedPoint]) {
            expect(() => factory('signed', 16, 32)).toThrow(
                new SolanaError(SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS, {
                    fractionalBits: 32,
                    totalBits: 16,
                }),
            );
        }
    });
});
