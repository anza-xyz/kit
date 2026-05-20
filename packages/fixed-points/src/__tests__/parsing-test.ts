import { SOLANA_ERROR__FIXED_POINTS__INVALID_STRING, SolanaError } from '@solana/errors';

import { parseDecimalString } from '../parsing';

describe('parseDecimalString', () => {
    it('parses positive integers', () => {
        expect(parseDecimalString('decimalFixedPoint', '0')).toEqual({ decimals: 0, raw: 0n });
        expect(parseDecimalString('decimalFixedPoint', '42')).toEqual({ decimals: 0, raw: 42n });
        expect(parseDecimalString('decimalFixedPoint', '007')).toEqual({ decimals: 0, raw: 7n });
    });

    it('parses negative integers', () => {
        expect(parseDecimalString('decimalFixedPoint', '-42')).toEqual({ decimals: 0, raw: -42n });
        expect(parseDecimalString('decimalFixedPoint', '-0')).toEqual({ decimals: 0, raw: 0n });
    });

    it('parses numbers with a fractional part', () => {
        expect(parseDecimalString('decimalFixedPoint', '1.5')).toEqual({ decimals: 1, raw: 15n });
        expect(parseDecimalString('decimalFixedPoint', '42.500')).toEqual({ decimals: 3, raw: 42500n });
        expect(parseDecimalString('decimalFixedPoint', '-0.25')).toEqual({ decimals: 2, raw: -25n });
    });

    it('parses numbers with an implicit leading or trailing zero', () => {
        expect(parseDecimalString('decimalFixedPoint', '.5')).toEqual({ decimals: 1, raw: 5n });
        expect(parseDecimalString('decimalFixedPoint', '-.25')).toEqual({ decimals: 2, raw: -25n });
        expect(parseDecimalString('decimalFixedPoint', '5.')).toEqual({ decimals: 0, raw: 5n });
    });

    it('rejects malformed inputs', () => {
        const badInputs = ['', '-', '.', 'abc', '1e3', '+1', ' 1', '1 ', '1.2.3', '1,5', '0x10'];
        for (const input of badInputs) {
            expect(() => parseDecimalString('decimalFixedPoint', input)).toThrow(
                new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_STRING, {
                    input,
                    kind: 'decimalFixedPoint',
                }),
            );
        }
    });

    it('preserves the provided kind in the error context', () => {
        expect(() => parseDecimalString('binaryFixedPoint', 'abc')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_STRING, {
                input: 'abc',
                kind: 'binaryFixedPoint',
            }),
        );
    });
});
