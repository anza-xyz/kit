import {
    SOLANA_ERROR__CODECS__INVALID_UTF8_BYTES,
    SOLANA_ERROR__CODECS__INVALID_UTF8_STRING,
    SolanaError,
} from '@solana/errors';

// Simulate a platform whose text encoding implementation ignores the
// `fatal` and `ignoreBOM` options and lacks `String.prototype.isWellFormed`,
// as some React Native polyfills do. The codec must behave the same there.
jest.mock('@solana/text-encoding-impl', () => ({
    // Like the polyfill, constructor options are ignored and not reflected,
    // and a leading byte order mark is never stripped.
    TextDecoder: class {
        decode(bytes: Uint8Array) {
            return new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
        }
    },
    TextEncoder: class {
        encode(value: string) {
            return new TextEncoder().encode(value);
        }
    },
}));

import { getUtf8Codec } from '../utf8';

describe('getUtf8Codec on a platform without fatal text decoding', () => {
    const stringPrototype = String.prototype as { isWellFormed?: unknown };
    const isWellFormed = stringPrototype.isWellFormed;
    beforeAll(() => {
        delete stringPrototype.isWellFormed;
    });
    afterAll(() => {
        stringPrototype.isWellFormed = isWellFormed;
    });

    it('still decodes valid UTF-8', () => {
        const utf8 = getUtf8Codec({ fatal: true });
        expect(utf8.decode(new Uint8Array([97, 0xe8, 0xaa, 0x9e]))).toBe('a語');
    });

    it('still strips a leading byte order mark by default', () => {
        const utf8 = getUtf8Codec();
        expect(utf8.decode(new Uint8Array([0xef, 0xbb, 0xbf, 97]))).toBe('a');
        expect(utf8.decode(new Uint8Array([97, 0xef, 0xbb, 0xbf]))).toBe('a\ufeff');
    });

    it('still preserves a leading byte order mark when asked to', () => {
        const utf8 = getUtf8Codec({ ignoreBOM: true });
        expect(utf8.decode(new Uint8Array([0xef, 0xbb, 0xbf, 97]))).toBe('\ufeffa');
    });

    it('still rejects malformed byte sequences', () => {
        const utf8 = getUtf8Codec({ fatal: true });
        expect(() => utf8.decode(new Uint8Array([97, 0xff]))).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_BYTES, { bytes: new Uint8Array([97, 0xff]), offset: 1 }),
        );
    });

    it('still rejects lone surrogates', () => {
        const utf8 = getUtf8Codec({ fatal: true });
        expect(utf8.encode('😀')).toStrictEqual(new Uint8Array([0xf0, 0x9f, 0x98, 0x80]));
        expect(() => utf8.encode('a\ud800')).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_STRING, { index: 1, value: 'a\ud800' }),
        );
    });
});
