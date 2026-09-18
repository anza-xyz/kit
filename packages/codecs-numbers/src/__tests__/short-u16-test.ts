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

    it('rejects terminated three-byte encodings above the u16 domain', () => {
        expect.hasAssertions();
        // No continuation bit on the third byte, but 0x04 << 14 is 65536.
        expect(() => shortU16().decode(new Uint8Array([0x80, 0x80, 0x04]))).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE, {
                codecDescription: 'shortU16',
                max: MAX,
                min: MIN,
                value: 65536,
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

    it('accepts exactly the terminated encodings of values 0..65535', () => {
        expect.hasAssertions();
        const codec = shortU16();
        const buf = new Uint8Array(3);
        // 1-byte space: 0x00..0x7f decode as-is.
        for (let b = 0; b < 0x80; b += 1) {
            buf[0] = b;
            expect(codec.read(buf.subarray(0, 1), 0)).toEqual([b, 1]);
        }
        // 1-byte space: 0x80..0xff carry a continuation bit, so they are truncated.
        for (let b = 0x80; b < 0x100; b += 1) {
            buf[0] = b;
            expect(() => codec.read(buf.subarray(0, 1), 0)).toThrow(SolanaError);
        }
        // 2-byte terminated space, fully enumerated.
        for (let a = 0x80; a < 0x100; a += 1) {
            for (let b = 0; b < 0x80; b += 1) {
                buf[0] = a;
                buf[1] = b;
                const want = (a & 0x7f) | (b << 7);
                expect(codec.read(buf.subarray(0, 2), 0)).toEqual([want, 2]);
            }
        }
        // 3-byte terminated space with third byte < 0x04: every value 0..65535.
        for (let a = 0x80; a < 0x100; a += 1) {
            for (let b = 0x80; b < 0x100; b += 1) {
                for (let c = 0; c < 0x04; c += 1) {
                    buf[0] = a;
                    buf[1] = b;
                    buf[2] = c;
                    const want = (a & 0x7f) | ((b & 0x7f) << 7) | (c << 14);
                    expect(codec.read(buf, 0)).toEqual([want, 3]);
                }
            }
        }
    });

    it('rejects every terminated encoding above the u16 domain', () => {
        expect.hasAssertions();
        const codec = shortU16();
        const buf = new Uint8Array(3);
        // Full first-overflow row: third byte 0x04, values 65536..131071.
        for (let a = 0x80; a < 0x100; a += 1) {
            for (let b = 0x80; b < 0x100; b += 1) {
                buf[0] = a;
                buf[1] = b;
                buf[2] = 0x04;
                const want = (a & 0x7f) | ((b & 0x7f) << 7) | (0x04 << 14);
                expect(() => codec.read(buf, 0)).toThrow(
                    new SolanaError(SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE, {
                        codecDescription: 'shortU16',
                        max: MAX,
                        min: MIN,
                        value: want,
                    }),
                );
            }
        }
    });

    it('never returns out-of-range values or past-end offsets for arbitrary bytes', () => {
        expect.hasAssertions();
        const codec = shortU16();
        // Deterministic PRNG so failures reproduce exactly.
        let state = 0x9e3779b9;
        const nextByte = () => {
            state = (state + 0x6d2b79f5) | 0;
            let z = state;
            z = Math.imul(z ^ (z >>> 15), z | 1);
            z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
            return (z ^ (z >>> 14)) & 0xff;
        };
        const successes: Array<{ bytes: Uint8Array; nextOffset: number; value: number }> = [];
        const failures: unknown[] = [];
        for (let i = 0; i < 5000; i += 1) {
            const len = nextByte() % 7;
            const bytes = new Uint8Array(len);
            for (let j = 0; j < len; j += 1) {
                bytes[j] = nextByte();
            }
            try {
                const [value, nextOffset] = codec.read(bytes, 0);
                successes.push({ bytes, nextOffset, value });
            } catch (e) {
                failures.push(e);
            }
        }
        // Every failed read must fail with a SolanaError.
        failures.forEach(failure => {
            expect(failure).toBeInstanceOf(SolanaError);
        });
        // Every successful read must be in-range, in-bounds, and round-trip.
        successes.forEach(({ bytes, nextOffset, value }) => {
            expect(value).toBeGreaterThanOrEqual(MIN);
            expect(value).toBeLessThanOrEqual(MAX);
            expect(nextOffset).toBeGreaterThanOrEqual(1);
            expect(nextOffset).toBeLessThanOrEqual(3);
            expect(nextOffset).toBeLessThanOrEqual(bytes.length);
            // Successful decodes round-trip through the encoder.
            expect(codec.decode(codec.encode(value))).toBe(value);
        });
    });
});
