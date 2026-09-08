import {
    SOLANA_ERROR__CODECS__INVALID_UTF8_BYTES,
    SOLANA_ERROR__CODECS__INVALID_UTF8_STRING,
    SolanaError,
} from '@solana/errors';

import { assertIsWellFormedUtf8String, findMalformedUtf8SequenceOffset } from '../assertions';
import { getUtf8Codec } from '../utf8';

describe('getUtf8Codec', () => {
    it('can encode UTF-8 strings', () => {
        const utf8 = getUtf8Codec();

        expect(utf8.encode('')).toStrictEqual(new Uint8Array([]));
        expect(utf8.decode(new Uint8Array([]))).toBe('');

        expect(utf8.encode('0')).toStrictEqual(new Uint8Array([48]));
        expect(utf8.decode(new Uint8Array([48]))).toBe('0');

        expect(utf8.encode('ABC')).toStrictEqual(new Uint8Array([65, 66, 67]));
        expect(utf8.decode(new Uint8Array([65, 66, 67]))).toBe('ABC');

        const encodedHelloWorld = new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]);
        expect(utf8.encode('Hello World!')).toStrictEqual(encodedHelloWorld);
        expect(utf8.decode(encodedHelloWorld)).toBe('Hello World!');

        expect(utf8.encode('語')).toStrictEqual(new Uint8Array([232, 170, 158]));
        expect(utf8.decode(new Uint8Array([232, 170, 158]))).toBe('語');
    });

    it('removes null characters from decoded strings by default', () => {
        const utf8 = getUtf8Codec();
        expect(utf8.encode('a\u0000b')).toStrictEqual(new Uint8Array([97, 0, 98]));
        expect(utf8.decode(new Uint8Array([97, 0, 98]))).toBe('ab');
        expect(utf8.decode(new Uint8Array([97, 98, 0, 0, 0]))).toBe('ab');
    });

    it('can preserve null characters in decoded strings', () => {
        const utf8 = getUtf8Codec({ removeNullCharacters: false });
        expect(utf8.decode(new Uint8Array([97, 0, 98]))).toBe('a\u0000b');
        expect(utf8.decode(new Uint8Array([97, 98, 0, 0, 0]))).toBe('ab\u0000\u0000\u0000');
    });

    it('strips a leading byte order mark by default', () => {
        const utf8 = getUtf8Codec();
        expect(utf8.encode('\ufeffa')).toStrictEqual(new Uint8Array([0xef, 0xbb, 0xbf, 97]));
        expect(utf8.decode(new Uint8Array([0xef, 0xbb, 0xbf, 97]))).toBe('a');
        // Only a leading byte order mark is stripped.
        expect(utf8.decode(new Uint8Array([97, 0xef, 0xbb, 0xbf, 98]))).toBe('a\ufeffb');
    });

    it('can preserve a leading byte order mark', () => {
        const utf8 = getUtf8Codec({ ignoreBOM: true });
        expect(utf8.decode(new Uint8Array([0xef, 0xbb, 0xbf, 97]))).toBe('\ufeffa');
        expect(utf8.decode(utf8.encode('\ufeffa'))).toBe('\ufeffa');
    });

    it('substitutes the replacement character for invalid UTF-8 by default', () => {
        const utf8 = getUtf8Codec();
        expect(utf8.decode(new Uint8Array([0xff]))).toBe('\ufffd');
        expect(utf8.decode(new Uint8Array([0xe8, 0xaa]))).toBe('\ufffd');
        expect(utf8.encode('\ud800')).toStrictEqual(new Uint8Array([0xef, 0xbf, 0xbd]));
    });

    it('can reject strings with lone surrogates when encoding', () => {
        const utf8 = getUtf8Codec({ fatal: true });

        // Surrogate pairs are fine.
        expect(utf8.encode('😀')).toStrictEqual(new Uint8Array([0xf0, 0x9f, 0x98, 0x80]));
        expect(utf8.encode('a😀b')).toStrictEqual(new Uint8Array([97, 0xf0, 0x9f, 0x98, 0x80, 98]));

        // Lone surrogates are not.
        expect(() => utf8.encode('\ud800')).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_STRING, { index: 0, value: '\ud800' }),
        );
        expect(() => utf8.encode('ab\udc00')).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_STRING, { index: 2, value: 'ab\udc00' }),
        );
        expect(() => utf8.encode('\ud800a')).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_STRING, { index: 0, value: '\ud800a' }),
        );
        expect(() => utf8.encode('\udc00\ud800')).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_STRING, { index: 0, value: '\udc00\ud800' }),
        );
    });

    it('can reject malformed byte sequences when decoding', () => {
        const utf8 = getUtf8Codec({ fatal: true });
        const invalid = (bytes: number[], offset: number) =>
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_BYTES, { bytes: new Uint8Array(bytes), offset });

        // Well-formed sequences of every length still decode.
        expect(utf8.decode(new Uint8Array([]))).toBe('');
        expect(utf8.decode(new Uint8Array([97, 0xc3, 0xa9, 0xe8, 0xaa, 0x9e, 0xf0, 0x9f, 0x98, 0x80]))).toBe('aé語😀');
        expect(utf8.decode(new Uint8Array([0xf4, 0x8f, 0xbf, 0xbf]))).toBe('\u{10ffff}');

        // Unexpected continuation byte.
        expect(() => utf8.decode(new Uint8Array([0x80]))).toThrow(invalid([0x80], 0));
        // Invalid lead bytes.
        expect(() => utf8.decode(new Uint8Array([0xff]))).toThrow(invalid([0xff], 0));
        expect(() => utf8.decode(new Uint8Array([0xf5, 0x80, 0x80, 0x80]))).toThrow(
            invalid([0xf5, 0x80, 0x80, 0x80], 0),
        );
        // Overlong encodings.
        expect(() => utf8.decode(new Uint8Array([0xc0, 0x80]))).toThrow(invalid([0xc0, 0x80], 0));
        expect(() => utf8.decode(new Uint8Array([0xe0, 0x80, 0x80]))).toThrow(invalid([0xe0, 0x80, 0x80], 0));
        expect(() => utf8.decode(new Uint8Array([0xf0, 0x80, 0x80, 0x80]))).toThrow(
            invalid([0xf0, 0x80, 0x80, 0x80], 0),
        );
        // Encoded surrogate (U+D800).
        expect(() => utf8.decode(new Uint8Array([0xed, 0xa0, 0x80]))).toThrow(invalid([0xed, 0xa0, 0x80], 0));
        // Above U+10FFFF.
        expect(() => utf8.decode(new Uint8Array([0xf4, 0x90, 0x80, 0x80]))).toThrow(
            invalid([0xf4, 0x90, 0x80, 0x80], 0),
        );
        // Truncated sequences.
        expect(() => utf8.decode(new Uint8Array([0xe8, 0xaa]))).toThrow(invalid([0xe8, 0xaa], 0));
        expect(() => utf8.decode(new Uint8Array([0xc3]))).toThrow(invalid([0xc3], 0));
        // The reported offset points at the start of the malformed sequence.
        expect(() => utf8.decode(new Uint8Array([97, 98, 0xe8, 0xaa, 99]))).toThrow(
            invalid([97, 98, 0xe8, 0xaa, 99], 2),
        );
    });

    it('relies on the platform TextDecoder when it implements the fatal and ignoreBOM options', () => {
        // The gates used to decide whether to validate the bytes and strip the byte order mark ourselves.
        expect(new TextDecoder('utf-8', { fatal: true }).fatal).toBe(true);
        expect(new TextDecoder('utf-8', { fatal: false }).fatal).toBe(false);
        expect(new TextDecoder('utf-8', { ignoreBOM: true }).ignoreBOM).toBe(true);
        expect(new TextDecoder('utf-8', { ignoreBOM: false }).ignoreBOM).toBe(false);

        // Platform failures are still surfaced as SolanaErrors with the offset.
        const utf8 = getUtf8Codec({ fatal: true });
        const bytes = new Uint8Array([97, 98, 0xff]);
        expect(() => utf8.decode(bytes)).toThrow(SolanaError);
        expect(() => utf8.decode(bytes)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_BYTES, { bytes, offset: 2 }),
        );
    });

    it('only validates the bytes from the given offset', () => {
        const utf8 = getUtf8Codec({ fatal: true });
        expect(utf8.read(new Uint8Array([0xff, 97, 98]), 1)).toStrictEqual(['ab', 3]);
        expect(() => utf8.read(new Uint8Array([97, 0xff]), 1)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_BYTES, { bytes: new Uint8Array([97, 0xff]), offset: 1 }),
        );
    });

    it('applies the fatal, ignoreBOM and removeNullCharacters options independently', () => {
        const bomThenNull = new Uint8Array([0xef, 0xbb, 0xbf, 97, 0, 98]);

        const fatalOnly = getUtf8Codec({ fatal: true });
        expect(fatalOnly.decode(bomThenNull)).toBe('ab');

        const bomOnly = getUtf8Codec({ ignoreBOM: true });
        expect(bomOnly.decode(bomThenNull)).toBe('\ufeffab');
        expect(bomOnly.decode(new Uint8Array([0xff]))).toBe('\ufffd');

        const nullOnly = getUtf8Codec({ removeNullCharacters: false });
        expect(nullOnly.decode(bomThenNull)).toBe('a\u0000b');
        expect(nullOnly.decode(new Uint8Array([0xff, 0]))).toBe('\ufffd\u0000');

        const all = getUtf8Codec({ fatal: true, ignoreBOM: true, removeNullCharacters: false });
        expect(all.decode(bomThenNull)).toBe('\ufeffa\u0000b');
        expect(() => all.decode(new Uint8Array([0xff]))).toThrow(SolanaError);
    });
});

describe('UTF-8 assertions', () => {
    // A small seeded PRNG (mulberry32) so that any divergence is reproducible.
    function createRandom(seed: number) {
        return () => {
            seed = (seed + 0x6d2b79f5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function rejects(assertion: () => void): boolean {
        try {
            assertion();
            return false;
        } catch {
            return true;
        }
    }

    /** Random byte arrays biased towards lead and continuation bytes. */
    function sampleBytes(count: number): Uint8Array[] {
        const random = createRandom(42);
        return Array.from({ length: count }, () => {
            const bytes = new Uint8Array(Math.floor(random() * 9));
            for (let j = 0; j < bytes.length; j++) {
                bytes[j] = random() < 0.2 ? Math.floor(random() * 0x80) : 0x80 + Math.floor(random() * 0x80);
            }
            return bytes;
        });
    }

    /** Random strings biased towards surrogate code units (U+D800 to U+DFFF). */
    function sampleStrings(count: number): string[] {
        const random = createRandom(42);
        return Array.from({ length: count }, () => {
            let value = '';
            for (let j = Math.floor(random() * 6); j > 0; j--) {
                const unit = random() < 0.3 ? Math.floor(random() * 0x80) : 0xd800 + Math.floor(random() * 0x800);
                value += String.fromCharCode(unit);
            }
            return value;
        });
    }

    it('rejects exactly the byte sequences that a fatal TextDecoder rejects', () => {
        const fatalDecoder = new TextDecoder('utf-8', { fatal: true });
        const samples = sampleBytes(20_000);
        const platform = samples.map(bytes => rejects(() => fatalDecoder.decode(bytes)));
        const ours = samples.map(bytes => findMalformedUtf8SequenceOffset(bytes) !== -1);

        const mismatches = samples.filter((_, i) => platform[i] !== ours[i]);
        expect(mismatches).toStrictEqual([]);

        // Sanity check that the sample exercised both outcomes.
        const rejected = platform.filter(Boolean).length;
        expect(rejected).toBeGreaterThan(1_000);
        expect(rejected).toBeLessThan(19_000);
    });

    it('rejects exactly the strings that String.prototype.isWellFormed rejects', () => {
        const isWellFormed = (value: string) => (value as unknown as { isWellFormed(): boolean }).isWellFormed();
        const samples = sampleStrings(20_000);
        const platform = samples.map(value => !isWellFormed(value));
        const ours = samples.map(value => rejects(() => assertIsWellFormedUtf8String(value)));

        const mismatches = samples.filter((_, i) => platform[i] !== ours[i]);
        expect(mismatches).toStrictEqual([]);

        const rejected = platform.filter(Boolean).length;
        expect(rejected).toBeGreaterThan(1_000);
        expect(rejected).toBeLessThan(19_000);
    });
});
