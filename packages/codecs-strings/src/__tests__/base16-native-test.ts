import { SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, SolanaError } from '@solana/errors';

const originalFromHex = (Uint8Array as unknown as { fromHex?: (value: string) => Uint8Array }).fromHex;
const originalToHex = (Uint8Array.prototype as unknown as { toHex?: () => string }).toHex;

function withNativeHexHelpers<T>(run: (context: {
    base16: ReturnType<typeof import('../base16').getBase16Codec>;
    fromHexMock: jest.Mock;
    toHexMock: jest.Mock;
}) => T): T {
    const fromHexMock = jest.fn((value: string) => {
        if (value.length % 2 !== 0) {
            throw new TypeError('Invalid hex length');
        }
        if (!/^[0-9a-fA-F]*$/.test(value)) {
            throw new TypeError('Invalid hex');
        }
        const bytes = new Uint8Array(value.length / 2);
        for (let i = 0; i < value.length; i += 2) {
            bytes[i / 2] = parseInt(value.slice(i, i + 2), 16);
        }
        return bytes;
    });

    const toHexMock = jest.fn(function (this: ReadonlyUint8Array) {
        return Array.from(this)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    });

    Object.defineProperty(Uint8Array, 'fromHex', { configurable: true, value: fromHexMock });
    Object.defineProperty(Uint8Array.prototype, 'toHex', { configurable: true, value: toHexMock });

    let getBase16Codec: typeof import('../base16').getBase16Codec;
    jest.isolateModules(() => {
        ({ getBase16Codec } = require('../base16'));
    });
    const base16 = getBase16Codec();

    try {
        return run({ base16, fromHexMock, toHexMock });
    } finally {
        if (originalFromHex) {
            Object.defineProperty(Uint8Array, 'fromHex', { configurable: true, value: originalFromHex });
        } else {
            delete (Uint8Array as unknown as { fromHex?: (value: string) => Uint8Array }).fromHex;
        }

        if (originalToHex) {
            Object.defineProperty(Uint8Array.prototype, 'toHex', { configurable: true, value: originalToHex });
        } else {
            delete (Uint8Array.prototype as unknown as { toHex?: () => string }).toHex;
        }
    }
}

describe('getBase16Codec with native hex helpers', () => {
    it('encodes/decodes using native helpers when available', () => {
        withNativeHexHelpers(({ base16, fromHexMock, toHexMock }) => {
            expect(base16.encode('2a')).toStrictEqual(new Uint8Array([42]));
            expect(base16.decode(new Uint8Array([42]))).toBe('2a');
            expect(fromHexMock).toHaveBeenCalled();
            expect(toHexMock).toHaveBeenCalled();
        });
    });

    it('falls back for odd-length hex strings', () => {
        withNativeHexHelpers(({ base16 }) => {
            expect(base16.encode('abc')).toStrictEqual(new Uint8Array([0xab, 0x00]));
        });
    });

    it('preserves invalid input errors', () => {
        withNativeHexHelpers(({ base16 }) => {
            let thrown: unknown;
            try {
                base16.encode('INVALID_INPUT');
            } catch (error) {
                thrown = error;
            }
            expect((thrown as SolanaError)?.name).toBe('SolanaError');
            expect((thrown as SolanaError).context).toMatchObject({
                __code: SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE,
                alphabet: '0123456789abcdef',
                base: 16,
                value: 'INVALID_INPUT',
            });
        });
    });
});
