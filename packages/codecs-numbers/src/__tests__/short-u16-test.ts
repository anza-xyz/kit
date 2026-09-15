import {
    SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH,
    SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import { getShortU16Codec } from '../short-u16';
import { assertRangeError, assertValid, assertValidEncode } from './__setup__';

const MIN = 0;
const MAX = 65535;
const shortU16 = getShortU16Codec;
const rangeErrorValues = {
    codecDescription: 'shortU16',
    max: MAX,
    min: MIN,
};

describe('getShortU16Codec', () => {
    it('encodes and decodes short u16 numbers', () => {
        expect.hasAssertions();
        assertValid(shortU16(), 0, '00');
        assertValid(shortU16(), 1, '01');
        assertValid(shortU16(), 42, '2a');
        assertValid(shortU16(), 127, '7f');
        assertValid(shortU16(), 128, '8001');
        assertValid(shortU16(), 16383, 'ff7f');
        assertValid(shortU16(), 16384, '808001');
        assertValidEncode(shortU16(), 0n, '00');
        assertValidEncode(shortU16(), 1n, '01');
        assertValidEncode(shortU16(), 42n, '2a');
        assertValidEncode(shortU16(), 127n, '7f');
        assertValidEncode(shortU16(), 128n, '8001');
        assertValidEncode(shortU16(), 16383n, 'ff7f');
        assertValidEncode(shortU16(), 16384n, '808001');

        // Pre-boundaries.
        assertValid(shortU16(), MIN + 1, '01');
        assertValid(shortU16(), MAX - 1, 'feff03');
        assertValidEncode(shortU16(), BigInt(MIN + 1), '01');
        assertValidEncode(shortU16(), BigInt(MAX - 1), 'feff03');

        // Boundaries.
        assertValid(shortU16(), MIN, '00');
        assertValid(shortU16(), MAX, 'ffff03');
        assertValidEncode(shortU16(), BigInt(MIN), '00');
        assertValidEncode(shortU16(), BigInt(MAX), 'ffff03');

        // Out of range.
        assertRangeError(rangeErrorValues, shortU16(), MIN - 1);
        assertRangeError(rangeErrorValues, shortU16(), MAX + 1);
        assertRangeError(rangeErrorValues, shortU16(), BigInt(MIN - 1));
        assertRangeError(rangeErrorValues, shortU16(), BigInt(MAX + 1));

        // Assert re-serialization.
        const codec = shortU16();
        for (let i = 0; i <= 0b1111111111111111; i += 1) {
            const bytes = codec.encode(i);
            expect(codec.decode(bytes)).toBe(i);
        }
    });

    it('throws when the buffer ends before the continuation chain terminates', () => {
        expect.hasAssertions();
        // Continuation bit set, but no further bytes.
        expect(() => shortU16().decode(new Uint8Array([0x80]))).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH, {
                bytesLength: 1,
                codecDescription: 'shortU16',
                expected: 2,
            }),
        );
        expect(() => shortU16().decode(new Uint8Array([0x80, 0x80]))).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH, {
                bytesLength: 2,
                codecDescription: 'shortU16',
                expected: 3,
            }),
        );
    });

    it('rejects continuation chains that exceed the three-byte encoding', () => {
        expect.hasAssertions();
        expect(() => shortU16().decode(new Uint8Array([0xff, 0xff, 0xff, 0x00]))).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE, {
                codecDescription: 'shortU16',
                max: MAX,
                min: MIN,
                value: 0x7f | (0x7f << 7) | (0x7f << 14),
            }),
        );
    });

    it('has the right sizes', () => {
        expect(shortU16().maxSize).toBe(3);
        expect(shortU16().getSizeFromValue(1)).toBe(1);
        expect(shortU16().getSizeFromValue(127)).toBe(1);
        expect(shortU16().getSizeFromValue(128)).toBe(2);
        expect(shortU16().getSizeFromValue(16383)).toBe(2);
        expect(shortU16().getSizeFromValue(16384)).toBe(3);
    });
});
