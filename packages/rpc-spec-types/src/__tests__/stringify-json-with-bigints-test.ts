import { stringifyJsonWithBigInts } from '../stringify-json-with-bigints';

const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_SAFE_INTEGER_PLUS_ONE = BigInt(Number.MAX_SAFE_INTEGER) + 1n;

describe('stringifyJsonWithBigInts', () => {
    it.each`
        input                        | expectedString
        ${0n}                        | ${'0'}
        ${-0n}                       | ${'0'}
        ${1n}                        | ${'1'}
        ${-1n}                       | ${'-1'}
        ${42n}                       | ${'42'}
        ${-42n}                      | ${'-42'}
        ${100000n}                   | ${'100000'}
        ${-100000n}                  | ${'-100000'}
        ${123n * 10n ** 32n}         | ${'12300000000000000000000000000000000'}
        ${-123n * 10n ** 32n}        | ${'-12300000000000000000000000000000000'}
        ${MAX_SAFE_INTEGER}          | ${MAX_SAFE_INTEGER.toString()}
        ${MAX_SAFE_INTEGER_PLUS_ONE} | ${MAX_SAFE_INTEGER_PLUS_ONE.toString()}
    `('strigifies bigint $input as a numerical value', ({ expectedString, input }) => {
        expect(stringifyJsonWithBigInts(input)).toBe(expectedString);
    });
    it('strigifies BigInts within nested structures', () => {
        const input = {
            alice: 42n,
            bob: [3.14, BigInt(3e8), { baz: 1234567890123456789012345678901234567890n }],
        };
        expect(stringifyJsonWithBigInts(input)).toBe(
            '{"alice":42,"bob":[3.14,300000000,{"baz":1234567890123456789012345678901234567890}]}',
        );
    });
    it.each`
        input          | expectedString
        ${0.5}         | ${'0.5'}
        ${-0.5}        | ${'-0.5'}
        ${3.14159265}  | ${'3.14159265'}
        ${-3.14159265} | ${'-3.14159265'}
        ${1e-5}        | ${'0.00001'}
        ${-1e-5}       | ${'-0.00001'}
        ${1e-32}       | ${'1e-32'}
        ${-1189e-32}   | ${'-1.189e-29'}
    `('strigifies number $input as a numerical value', ({ expectedString, input }) => {
        expect(stringifyJsonWithBigInts(input)).toBe(expectedString);
    });
    it.each([
        null,
        false,
        true,
        [],
        [null, true, false],
        {},
        { foo: 'bar' },
        '',
        'Hello World',
        '42 apples',
        'base64',
        '"base64',
        '""base64',
        '\\base64',
        '\\"base64',
        '\\""base64',
        '\\\\base64',
        '\\\\"base64',
        '\\\\""base64',
        'He said: "I will eat 3 bananas"',
        { message_100: 'Hello to the 1st World' },
        { message_200: 'Hello to the "2nd World"' },
        { data: ['', 'base64'] },
    ])('does not alter the value of %s', input => {
        expect(stringifyJsonWithBigInts(input)).toBe(JSON.stringify(input));
    });
});

describe('stringifyJsonWithBigInts with a `BigInt.prototype.toJSON` that returns the decimal string', () => {
    beforeEach(() => {
        Object.defineProperty(BigInt.prototype, 'toJSON', {
            configurable: true,
            value: function (this: bigint) {
                return this.toString();
            },
        });
    });
    afterEach(() => {
        Reflect.deleteProperty(BigInt.prototype, 'toJSON');
    });
    it.each`
        input                        | expectedString
        ${42n}                       | ${'42'}
        ${{ alice: 42n }}            | ${'{"alice":42}'}
        ${[42n, { bob: [-1n] }]}     | ${'[42,{"bob":[-1]}]'}
        ${MAX_SAFE_INTEGER_PLUS_ONE} | ${MAX_SAFE_INTEGER_PLUS_ONE.toString()}
    `('stringifies bigint $input as $expectedString', ({ expectedString, input }) => {
        expect(stringifyJsonWithBigInts(input)).toBe(expectedString);
    });
    it('reads a getter once, and writes its bigint as `toJSON` returned it', () => {
        const readSlot = jest.fn(() => 42n);
        const input = {
            get slot() {
                return readSlot();
            },
        };
        expect(stringifyJsonWithBigInts(input)).toBe('{"slot":"42"}');
        expect(readSlot).toHaveBeenCalledTimes(1);
    });
});

describe('stringifyJsonWithBigInts with a value whose own `toJSON` returns a bigint', () => {
    it('stringifies the returned bigint as a numerical value', () => {
        expect(stringifyJsonWithBigInts({ slot: { toJSON: () => 42n } })).toBe('{"slot":42}');
    });
});
