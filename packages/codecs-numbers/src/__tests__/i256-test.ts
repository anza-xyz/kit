import { Endian } from '../common';
import { getI256Codec } from '../i256';
import { assertRangeError, assertValid } from './__setup__';

const MIN = -BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') - 1n;
const MAX = BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
const i256 = getI256Codec;
const rangeErrorValues = {
    codecDescription: 'i256',
    max: MAX,
    min: MIN,
};

describe('getI256Codec', () => {
    it('encodes and decodes i256 numbers', () => {
        expect.hasAssertions();
        const i256LE = i256();
        const i256BE = i256({ endian: Endian.Big });

        assertValid(i256LE, 0n, '0000000000000000000000000000000000000000000000000000000000000000');
        assertValid(i256BE, 0n, '0000000000000000000000000000000000000000000000000000000000000000');
        assertValid(i256LE, 1n, '0100000000000000000000000000000000000000000000000000000000000000');
        assertValid(i256BE, 1n, '0000000000000000000000000000000000000000000000000000000000000001');
        assertValid(i256LE, 42n, '2a00000000000000000000000000000000000000000000000000000000000000');
        assertValid(i256BE, 42n, '000000000000000000000000000000000000000000000000000000000000002a');
        assertValid(i256LE, -1n, 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        assertValid(i256BE, -1n, 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        assertValid(i256LE, -42n, 'd6ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        assertValid(i256BE, -42n, 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd6');

        // Pre-boundaries.
        assertValid(i256LE, MIN + 1n, '0100000000000000000000000000000000000000000000000000000000000080');
        assertValid(i256BE, MIN + 1n, '8000000000000000000000000000000000000000000000000000000000000001');
        assertValid(i256LE, MAX - 1n, 'feffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f');
        assertValid(i256BE, MAX - 1n, '7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe');

        // Boundaries.
        assertValid(i256LE, MIN, '0000000000000000000000000000000000000000000000000000000000000080');
        assertValid(i256BE, MIN, '8000000000000000000000000000000000000000000000000000000000000000');
        assertValid(i256LE, MAX, 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f');
        assertValid(i256BE, MAX, '7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

        // Out of range.
        assertRangeError(rangeErrorValues, i256LE, MIN - 1n);
        assertRangeError(rangeErrorValues, i256BE, MIN - 1n);
        assertRangeError(rangeErrorValues, i256LE, MAX + 1n);
        assertRangeError(rangeErrorValues, i256BE, MAX + 1n);
    });

    it('has the right size', () => {
        expect(i256().fixedSize).toBe(32);
    });
});
