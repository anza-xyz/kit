import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__FIXED_POINTS__INVALID_DECIMALS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_STRING,
    SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_ZERO_DENOMINATOR_RATIO,
    SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS,
    SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import { decimalFixedPoint, ratioDecimalFixedPoint, rawDecimalFixedPoint } from '../decimal/core';

describe('decimalFixedPoint', () => {
    it('constructs values from decimal strings', () => {
        const usdc = decimalFixedPoint('unsigned', 64, 6);
        expect(usdc('0').raw).toBe(0n);
        expect(usdc('1').raw).toBe(1000000n);
        expect(usdc('42.5').raw).toBe(42500000n);
        expect(usdc('0.000001').raw).toBe(1n);
        expect(usdc('1234567890.123456').raw).toBe(1234567890123456n);
    });

    it('accepts negative values for signed shapes', () => {
        const signed = decimalFixedPoint('signed', 32, 2);
        expect(signed('-1.5').raw).toBe(-150n);
        expect(signed('-0').raw).toBe(0n);
    });

    it('returns values whose fields match the shape and kind', () => {
        const usdc = decimalFixedPoint('unsigned', 64, 6);
        expect(usdc('1.5')).toEqual({
            decimals: 6,
            kind: 'decimalFixedPoint',
            raw: 1500000n,
            signedness: 'unsigned',
            totalBits: 64,
        });
    });

    it('returns frozen values', () => {
        const usdc = decimalFixedPoint('unsigned', 64, 6);
        expect(usdc('1.5')).toBeFrozenObject();
    });

    it('throws STRICT_MODE_PRECISION_LOSS under the default rounding when the input has more precision than the target', () => {
        const cents = decimalFixedPoint('unsigned', 16, 2);
        expect(() => cents('1.234')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'decimalFixedPoint',
                operation: 'fromString',
            }),
        );
    });

    it('rounds excess precision when a non-strict rounding mode is supplied', () => {
        const cents = decimalFixedPoint('unsigned', 16, 2);
        expect(cents('1.234', 'floor').raw).toBe(123n);
        expect(cents('1.234', 'ceil').raw).toBe(124n);
        expect(cents('1.235', 'round').raw).toBe(124n); // tie away from zero
        expect(cents('1.234', 'trunc').raw).toBe(123n);
    });

    it('throws VALUE_OUT_OF_RANGE when the result exceeds the unsigned upper bound', () => {
        const tiny = decimalFixedPoint('unsigned', 8, 0);
        expect(() => tiny('256')).toThrow(
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

    it('throws VALUE_OUT_OF_RANGE when the result exceeds the signed upper bound', () => {
        const signed = decimalFixedPoint('signed', 8, 0);
        expect(() => signed('128')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'decimalFixedPoint',
                max: 127n,
                min: -128n,
                raw: 128n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });

    it('throws VALUE_OUT_OF_RANGE when the result is below the signed lower bound', () => {
        const signed = decimalFixedPoint('signed', 8, 0);
        expect(() => signed('-129')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'decimalFixedPoint',
                max: 127n,
                min: -128n,
                raw: -129n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });

    it('throws INVALID_STRING on malformed inputs', () => {
        const usdc = decimalFixedPoint('unsigned', 64, 6);
        expect(() => usdc('abc')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_STRING, {
                input: 'abc',
                kind: 'decimalFixedPoint',
            }),
        );
    });

    it('throws INVALID_TOTAL_BITS when totalBits is not a positive integer', () => {
        for (const bad of [0, -1, 1.5, Number.NaN, '64' as unknown as number]) {
            expect(() => decimalFixedPoint('unsigned', bad, 6)).toThrow(
                new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS, {
                    kind: 'decimalFixedPoint',
                    totalBits: bad,
                }),
            );
        }
    });

    it('throws INVALID_DECIMALS when decimals is not a non-negative integer', () => {
        for (const bad of [-1, 1.5, Number.NaN, '6' as unknown as number]) {
            expect(() => decimalFixedPoint('unsigned', 64, bad)).toThrow(
                new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_DECIMALS, { decimals: bad }),
            );
        }
    });

    it('allows decimals to exceed totalBits, since decimal shapes do not enforce that constraint', () => {
        // decimal(unsigned, 8, 10) with raw=0n represents 0, which fits fine
        // — decimal fixed-points with many decimals and few bits are valid.
        const tiny = decimalFixedPoint('unsigned', 8, 10);
        expect(tiny('0').raw).toBe(0n);
    });
});

describe('rawDecimalFixedPoint', () => {
    it('constructs values directly from a raw bigint', () => {
        const cents = rawDecimalFixedPoint('unsigned', 16, 2);
        expect(cents(425n)).toEqual({
            decimals: 2,
            kind: 'decimalFixedPoint',
            raw: 425n,
            signedness: 'unsigned',
            totalBits: 16,
        });
    });

    it('returns frozen values', () => {
        const cents = rawDecimalFixedPoint('unsigned', 16, 2);
        expect(cents(425n)).toBeFrozenObject();
    });

    it('accepts negative raw values for signed shapes', () => {
        const signed = rawDecimalFixedPoint('signed', 8, 2);
        expect(signed(-128n).raw).toBe(-128n);
    });

    it('throws VALUE_OUT_OF_RANGE when the raw value exceeds the unsigned upper bound', () => {
        const tiny = rawDecimalFixedPoint('unsigned', 8, 0);
        expect(() => tiny(256n)).toThrow(
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

    it('throws VALUE_OUT_OF_RANGE when the raw value exceeds the signed upper bound', () => {
        const signed = rawDecimalFixedPoint('signed', 8, 0);
        expect(() => signed(128n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'decimalFixedPoint',
                max: 127n,
                min: -128n,
                raw: 128n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });

    it('throws VALUE_OUT_OF_RANGE when the raw value is below the signed lower bound', () => {
        const signed = rawDecimalFixedPoint('signed', 8, 0);
        expect(() => signed(-129n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'decimalFixedPoint',
                max: 127n,
                min: -128n,
                raw: -129n,
                signedness: 'signed',
                totalBits: 8,
            }),
        );
    });
});

describe('ratioDecimalFixedPoint', () => {
    it('constructs values from exact ratios', () => {
        const prob = ratioDecimalFixedPoint('unsigned', 64, 4);
        expect(prob(1n, 4n).raw).toBe(2500n); // 0.2500
        expect(prob(1n, 2n).raw).toBe(5000n); // 0.5000
    });

    it('returns frozen values', () => {
        const prob = ratioDecimalFixedPoint('unsigned', 64, 4);
        expect(prob(1n, 4n)).toBeFrozenObject();
    });

    it('throws STRICT_MODE_PRECISION_LOSS under the default rounding when the ratio is inexact', () => {
        const prob = ratioDecimalFixedPoint('unsigned', 64, 4);
        expect(() => prob(1n, 3n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'decimalFixedPoint',
                operation: 'fromRatio',
            }),
        );
    });

    it('rounds inexact ratios when a non-strict rounding mode is supplied', () => {
        const prob = ratioDecimalFixedPoint('unsigned', 64, 4);
        expect(prob(1n, 3n, 'floor').raw).toBe(3333n);
        expect(prob(1n, 3n, 'ceil').raw).toBe(3334n);
        expect(prob(1n, 3n, 'round').raw).toBe(3333n);
    });

    it('throws INVALID_ZERO_DENOMINATOR_RATIO when the denominator is zero', () => {
        const prob = ratioDecimalFixedPoint('unsigned', 64, 4);
        expect(() => prob(1n, 0n)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_ZERO_DENOMINATOR_RATIO, {
                denominator: 0n,
                kind: 'decimalFixedPoint',
                numerator: 1n,
            }),
        );
    });

    it('throws VALUE_OUT_OF_RANGE when the ratio overflows the target shape', () => {
        const tiny = ratioDecimalFixedPoint('unsigned', 8, 0);
        expect(() => tiny(256n, 1n)).toThrow(
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
});

describe('decimal factory shape validation', () => {
    it('rejects zero totalBits up front from every decimal factory', () => {
        for (const factory of [decimalFixedPoint, rawDecimalFixedPoint, ratioDecimalFixedPoint]) {
            expect(() => factory('unsigned', 0, 6)).toThrow(
                new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS, {
                    kind: 'decimalFixedPoint',
                    totalBits: 0,
                }),
            );
        }
    });

    it('rejects negative decimals up front from every decimal factory', () => {
        for (const factory of [decimalFixedPoint, rawDecimalFixedPoint, ratioDecimalFixedPoint]) {
            expect(() => factory('unsigned', 64, -1)).toThrow(
                new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_DECIMALS, { decimals: -1 }),
            );
        }
    });
});
