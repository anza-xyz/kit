import { Endian } from '../common';
import { getU256Codec } from '../u256';
import { assertRangeError, assertValid } from './__setup__';

const MIN = 0n;
const MAX = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
const HALF = BigInt('0xffffffffffffffffffffffffffffffff');
const u256 = getU256Codec;
const rangeErrorValues = {
    codecDescription: 'u256',
    max: MAX,
    min: MIN,
};

describe('getU256Codec', () => {
    it('encodes and decodes u256 numbers', () => {
        expect.hasAssertions();
        const u256LE = u256();
        const u256BE = u256({ endian: Endian.Big });

        assertValid(u256LE, 1n, '0100000000000000000000000000000000000000000000000000000000000000');
        assertValid(u256BE, 1n, '0000000000000000000000000000000000000000000000000000000000000001');
        assertValid(u256LE, 42n, '2a00000000000000000000000000000000000000000000000000000000000000');
        assertValid(u256BE, 42n, '000000000000000000000000000000000000000000000000000000000000002a');

        // Half bytes.
        assertValid(u256LE, HALF, 'ffffffffffffffffffffffffffffffff00000000000000000000000000000000');
        assertValid(u256BE, HALF, '00000000000000000000000000000000ffffffffffffffffffffffffffffffff');

        // Pre-boundaries.
        assertValid(u256LE, MIN + 1n, '0100000000000000000000000000000000000000000000000000000000000000');
        assertValid(u256BE, MIN + 1n, '0000000000000000000000000000000000000000000000000000000000000001');
        assertValid(u256LE, MAX - 1n, 'feffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        assertValid(u256BE, MAX - 1n, 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe');

        // Boundaries.
        assertValid(u256LE, MIN, '0000000000000000000000000000000000000000000000000000000000000000');
        assertValid(u256BE, MIN, '0000000000000000000000000000000000000000000000000000000000000000');
        assertValid(u256LE, MAX, 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        assertValid(u256BE, MAX, 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

        // Out of range.
        assertRangeError(rangeErrorValues, u256LE, MIN - 1n);
        assertRangeError(rangeErrorValues, u256BE, MIN - 1n);
        assertRangeError(rangeErrorValues, u256LE, MAX + 1n);
        assertRangeError(rangeErrorValues, u256BE, MAX + 1n);
    });

    it('has the right size', () => {
        expect(u256().fixedSize).toBe(32);
    });
});
