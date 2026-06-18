import { SOLANA_ERROR__MALFORMED_BIGINT_STRING, SolanaError } from '@solana/errors';
import fs from 'fs';
import path from 'path';

import { parseJsonWithBigInts } from '../parse-json-with-bigints';

const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_SAFE_INTEGER_PLUS_ONE = BigInt(Number.MAX_SAFE_INTEGER) + 1n;

describe('parseJsonWithBigInts', () => {
    it.each`
        input                                   | expectedBigInt
        ${'0'}                                  | ${0n}
        ${'-0'}                                 | ${-0n}
        ${'1'}                                  | ${1n}
        ${'-1'}                                 | ${-1n}
        ${'42'}                                 | ${42n}
        ${'-42'}                                | ${-42n}
        ${'1e5'}                                | ${100000n}
        ${'-1e5'}                               | ${-100000n}
        ${'1E5'}                                | ${100000n}
        ${'-1E5'}                               | ${-100000n}
        ${'123e+32'}                            | ${123n * 10n ** 32n}
        ${'-123e+32'}                           | ${-123n * 10n ** 32n}
        ${'123E+32'}                            | ${123n * 10n ** 32n}
        ${'-123E+32'}                           | ${-123n * 10n ** 32n}
        ${MAX_SAFE_INTEGER.toString()}          | ${MAX_SAFE_INTEGER}
        ${MAX_SAFE_INTEGER_PLUS_ONE.toString()} | ${MAX_SAFE_INTEGER_PLUS_ONE}
    `('parses $input as a bigint', ({ expectedBigInt, input }) => {
        expect(parseJsonWithBigInts(input)).toBe(expectedBigInt);
    });
    it('parses BigInts within nested structures', () => {
        const input = '{ "alice": 42, "bob": [3.14, 3e+8, { "baz": 1234567890123456789012345678901234567890 }] }';
        expect(parseJsonWithBigInts(input)).toStrictEqual({
            alice: 42n,
            bob: [3.14, BigInt(3e8), { baz: 1234567890123456789012345678901234567890n }],
        });
    });
    it.each`
        input            | expectedNumber
        ${'0.5'}         | ${0.5}
        ${'-0.5'}        | ${-0.5}
        ${'3.14159265'}  | ${3.14159265}
        ${'-3.14159265'} | ${-3.14159265}
        ${'1e-5'}        | ${1e-5}
        ${'-1e-5'}       | ${-1e-5}
        ${'1E-5'}        | ${1e-5}
        ${'-1E-5'}       | ${-1e-5}
        ${'1e-32'}       | ${1e-32}
        ${'-1189e-32'}   | ${-1189e-32}
    `('parses $input as a number', ({ expectedNumber, input }) => {
        expect(parseJsonWithBigInts(input)).toBe(expectedNumber);
    });
    it.each([
        'null',
        'false',
        'true',
        '[]',
        '[null, true, false]',
        '{}',
        '{ "foo": "bar" }',
        '""',
        '"Hello World"',
        '"42 apples"',
        '"base64"',
        '"\\base64"',
        '"\\"base64"',
        '"\\\\base64"',
        '"\\"\\"base64"',
        '"\\\\\\"base64"',
        '"\\\\\\"\\"base64"',
        '"He said: \\"I will eat 3 bananas\\""',
        '{ "message_100": "Hello to the 1st World" }',
        '{ "message_200": "Hello to the \\"2nd World\\"" }',
        '{"data":["","base64"]}',
    ])('does not alter the value of %s', input => {
        expect(parseJsonWithBigInts(input)).toStrictEqual(JSON.parse(input));
    });
    it.each([
        '{"$n":"not-a-number"}',
        '{"$n":"abc"}',
        '{"$n":""}',
        '{"$n":"123a"}',
        '{"$n":"1.5"}',
        '{"$n":"0x10"}',
        '{"$n":"1e-5"}',
        '{"$n":"Infinity"}',
    ])('throws a `SolanaError` when an injected `$n` value object is not a valid integer (%s)', input => {
        const value = JSON.parse(input).$n;
        expect(() => parseJsonWithBigInts(input)).toThrow(
            new SolanaError(SOLANA_ERROR__MALFORMED_BIGINT_STRING, { value }),
        );
    });
    it.each(['{"$n":"1e9999999"}', '{"$n":"1e99999999"}', '{"$n":"1e999999999"}', '{"$n":"1e999999999999999999"}'])(
        'rejects an absurdly large `$n` value object instead of materializing it (%s)',
        input => {
            const value = JSON.parse(input).$n;
            expect(() => parseJsonWithBigInts(input)).toThrow(
                new SolanaError(SOLANA_ERROR__MALFORMED_BIGINT_STRING, { value }),
            );
        },
    );
    it('parses an integer whose digit count is exactly at the limit', () => {
        // `1e999` materializes to a 1,000-digit integer (1 mantissa digit + 999 zeroes).
        expect(parseJsonWithBigInts('{"$n":"1e999"}')).toBe(10n ** 999n);
    });
    it('rejects an integer whose digit count exceeds the limit by one', () => {
        // `1e1000` would materialize to a 1,001-digit integer.
        expect(() => parseJsonWithBigInts('{"$n":"1e1000"}')).toThrow(
            new SolanaError(SOLANA_ERROR__MALFORMED_BIGINT_STRING, { value: '1e1000' }),
        );
    });
    it('can parse complex JSON files', () => {
        const largeJsonPath = path.join(__dirname, 'large-json-file.json');
        const largeJsonString = fs.readFileSync(largeJsonPath, 'utf8');
        const expectedResult = JSON.parse(largeJsonString, (key, value) => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (key === 'lamports') return 142302234983644260n;
            // eslint-disable-next-line jest/no-conditional-in-test
            if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
            return value;
        });
        expect(parseJsonWithBigInts(largeJsonString)).toStrictEqual(expectedResult);
    });
});
