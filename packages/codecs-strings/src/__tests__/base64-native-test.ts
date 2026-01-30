import { SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, SolanaError } from '@solana/errors';

const originalFromBase64 = (Uint8Array as unknown as {
    fromBase64?: (
        value: string,
        options?: { alphabet?: 'base64' | 'base64url'; lastChunkHandling?: string },
    ) => Uint8Array;
}).fromBase64;
const originalToBase64 = (Uint8Array.prototype as unknown as {
    toBase64?: (options?: { alphabet?: 'base64' | 'base64url'; omitPadding?: boolean }) => string;
}).toBase64;

function withNativeBase64Helpers<T>(run: (context: {
    base64: ReturnType<typeof import('../base64').getBase64Codec>;
    fromBase64Mock: jest.Mock;
    toBase64Mock: jest.Mock;
}) => T): T {
    const fromBase64Mock = jest.fn(
        (value: string, options?: { alphabet?: 'base64' | 'base64url'; lastChunkHandling?: string }) => {
            const stripped = value.replace(/=/g, '');
            if (!/^[A-Za-z0-9+/]*$/.test(stripped)) {
                throw new TypeError('Invalid base64');
            }
            if (options?.lastChunkHandling === 'strict' && value.length % 4 !== 0) {
                throw new TypeError('Invalid base64 padding');
            }
            return new Uint8Array(Buffer.from(value, 'base64'));
        },
    );

    const toBase64Mock = jest.fn(function (this: ReadonlyUint8Array) {
        return Buffer.from(this).toString('base64');
    });

    Object.defineProperty(Uint8Array, 'fromBase64', { configurable: true, value: fromBase64Mock });
    Object.defineProperty(Uint8Array.prototype, 'toBase64', { configurable: true, value: toBase64Mock });

    let getBase64Codec: typeof import('../base64').getBase64Codec;
    jest.isolateModules(() => {
        ({ getBase64Codec } = require('../base64'));
    });
    const base64 = getBase64Codec();

    try {
        return run({ base64, fromBase64Mock, toBase64Mock });
    } finally {
        if (originalFromBase64) {
            Object.defineProperty(Uint8Array, 'fromBase64', { configurable: true, value: originalFromBase64 });
        } else {
            delete (Uint8Array as unknown as { fromBase64?: unknown }).fromBase64;
        }

        if (originalToBase64) {
            Object.defineProperty(Uint8Array.prototype, 'toBase64', { configurable: true, value: originalToBase64 });
        } else {
            delete (Uint8Array.prototype as unknown as { toBase64?: unknown }).toBase64;
        }
    }
}

describe('getBase64Codec with native base64 helpers', () => {
    it('encodes/decodes using native helpers when available', () => {
        withNativeBase64Helpers(({ base64, fromBase64Mock, toBase64Mock }) => {
            expect(base64.encode('AQ==')).toStrictEqual(new Uint8Array([1]));
            expect(base64.decode(new Uint8Array([1]))).toBe('AQ==');
            expect(fromBase64Mock).toHaveBeenCalled();
            expect(toBase64Mock).toHaveBeenCalled();
        });
    });

    it('passes loose padding handling in node tests', () => {
        withNativeBase64Helpers(({ base64, fromBase64Mock }) => {
            expect(base64.encode('AA=')).toStrictEqual(new Uint8Array([0]));
            expect(fromBase64Mock.mock.calls[0][1]).toEqual({ alphabet: 'base64', lastChunkHandling: 'loose' });
        });
    });

    it('preserves invalid input errors', () => {
        withNativeBase64Helpers(({ base64 }) => {
            let thrown: unknown;
            try {
                base64.encode('INVALID_INPUT');
            } catch (error) {
                thrown = error;
            }
            expect((thrown as SolanaError)?.name).toBe('SolanaError');
            expect((thrown as SolanaError).context).toMatchObject({
                __code: SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE,
                alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
                base: 64,
                value: 'INVALID_INPUT',
            });
        });
    });
});
