import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY,
    SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH,
    SOLANA_ERROR__FIXED_POINTS__INVALID_DECIMALS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH,
    SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED,
    SolanaError,
} from '@solana/errors';

import {
    decimalFixedPoint,
    getDecimalFixedPointCodec,
    getDecimalFixedPointDecoder,
    getDecimalFixedPointEncoder,
    rawDecimalFixedPoint,
} from '../decimal';

describe('getDecimalFixedPointEncoder', () => {
    it('encodes an unsigned 8-bit value', () => {
        const encoder = getDecimalFixedPointEncoder('unsigned', 8, 0);
        expect(encoder.encode(rawDecimalFixedPoint('unsigned', 8, 0)(42n))).toEqual(new Uint8Array([0x2a]));
    });

    it("encodes a signed 8-bit negative value using two's-complement", () => {
        const encoder = getDecimalFixedPointEncoder('signed', 8, 0);
        expect(encoder.encode(rawDecimalFixedPoint('signed', 8, 0)(-1n))).toEqual(new Uint8Array([0xff]));
    });

    it('encodes an unsigned 64-bit value at 2 decimals in little-endian by default', () => {
        const encoder = getDecimalFixedPointEncoder('unsigned', 64, 2);
        // 42.50 has raw 4250n → 0x0000000000000019a in LE → [0x9a, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
        expect(encoder.encode(decimalFixedPoint('unsigned', 64, 2)('42.50'))).toEqual(
            new Uint8Array([0x9a, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        );
    });

    it('encodes in big-endian when configured', () => {
        const encoder = getDecimalFixedPointEncoder('unsigned', 16, 0, { endian: 'be' });
        expect(encoder.encode(rawDecimalFixedPoint('unsigned', 16, 0)(0x1234n))).toEqual(new Uint8Array([0x12, 0x34]));
    });

    it('encodes an unsigned 24-bit value (byte-aligned width without a matching number codec)', () => {
        const encoder = getDecimalFixedPointEncoder('unsigned', 24, 0);
        expect(encoder.encode(rawDecimalFixedPoint('unsigned', 24, 0)(0xabcdefn))).toEqual(
            new Uint8Array([0xef, 0xcd, 0xab]),
        );
    });

    it('reports the correct fixed size', () => {
        expect(getDecimalFixedPointEncoder('unsigned', 64, 2).fixedSize).toBe(8);
        expect(getDecimalFixedPointEncoder('unsigned', 128, 18).fixedSize).toBe(16);
    });

    it('throws TOTAL_BITS_NOT_BYTE_ALIGNED for a non-byte-aligned total bits', () => {
        expect(() => getDecimalFixedPointEncoder('unsigned', 12, 2)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED, {
                kind: 'decimalFixedPoint',
                totalBits: 12,
            }),
        );
    });

    it('throws INVALID_TOTAL_BITS for a non-positive total bits', () => {
        expect(() => getDecimalFixedPointEncoder('unsigned', 0, 0)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS, {
                kind: 'decimalFixedPoint',
                totalBits: 0,
            }),
        );
    });

    it('throws INVALID_DECIMALS for a negative decimals', () => {
        expect(() => getDecimalFixedPointEncoder('unsigned', 64, -1)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_DECIMALS, {
                decimals: -1,
            }),
        );
    });

    it('throws SHAPE_MISMATCH when encoding a value whose shape does not match the codec', () => {
        const encoder = getDecimalFixedPointEncoder('unsigned', 64, 6);
        const mismatched = rawDecimalFixedPoint('unsigned', 64, 2)(1n);
        expect(() =>
            // @ts-expect-error The value's shape does not match the codec's shape.
            encoder.encode(mismatched),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'decimalFixedPoint',
                actualScale: 2,
                actualScaleLabel: 'decimals',
                actualSignedness: 'unsigned',
                actualTotalBits: 64,
                expectedKind: 'decimalFixedPoint',
                expectedScale: 6,
                expectedScaleLabel: 'decimals',
                expectedSignedness: 'unsigned',
                expectedTotalBits: 64,
                operation: 'getDecimalFixedPointEncoder',
            }),
        );
    });
});

describe('getDecimalFixedPointDecoder', () => {
    it('decodes an unsigned 8-bit value', () => {
        const decoder = getDecimalFixedPointDecoder('unsigned', 8, 0);
        expect(decoder.decode(new Uint8Array([0x2a]))).toEqual({
            decimals: 0,
            kind: 'decimalFixedPoint',
            raw: 42n,
            signedness: 'unsigned',
            totalBits: 8,
        });
    });

    it("decodes a signed 8-bit negative value via two's-complement", () => {
        const decoder = getDecimalFixedPointDecoder('signed', 8, 0);
        expect(decoder.decode(new Uint8Array([0xff])).raw).toBe(-1n);
    });

    it('decodes an unsigned 64-bit value at 2 decimals in little-endian', () => {
        const decoder = getDecimalFixedPointDecoder('unsigned', 64, 2);
        expect(decoder.decode(new Uint8Array([0x9a, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])).raw).toBe(4250n);
    });

    it('decodes in big-endian when configured', () => {
        const decoder = getDecimalFixedPointDecoder('unsigned', 16, 0, { endian: 'be' });
        expect(decoder.decode(new Uint8Array([0x12, 0x34])).raw).toBe(0x1234n);
    });

    it('returns a frozen value', () => {
        const decoder = getDecimalFixedPointDecoder('unsigned', 8, 0);
        expect(decoder.decode(new Uint8Array([0x2a]))).toBeFrozenObject();
    });

    it('throws TOTAL_BITS_NOT_BYTE_ALIGNED for a non-byte-aligned total bits', () => {
        expect(() => getDecimalFixedPointDecoder('unsigned', 12, 2)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED, {
                kind: 'decimalFixedPoint',
                totalBits: 12,
            }),
        );
    });

    it('throws CANNOT_DECODE_EMPTY_BYTE_ARRAY when decoding from an empty buffer', () => {
        const decoder = getDecimalFixedPointDecoder('unsigned', 16, 2);
        expect(() => decoder.decode(new Uint8Array([]))).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY, {
                codecDescription: 'getDecimalFixedPointDecoder',
            }),
        );
    });

    it('throws INVALID_BYTE_LENGTH when decoding from a too-short buffer', () => {
        const decoder = getDecimalFixedPointDecoder('unsigned', 64, 6);
        expect(() => decoder.decode(new Uint8Array([0x01, 0x02]))).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH, {
                bytesLength: 2,
                codecDescription: 'getDecimalFixedPointDecoder',
                expected: 8,
            }),
        );
    });
});

describe('getDecimalFixedPointCodec', () => {
    describe.each([{ endian: 'le' as const }, { endian: 'be' as const }])('under $endian endianness', ({ endian }) => {
        it.each([
            { decimals: 0, raw: 42n, signedness: 'signed' as const, totalBits: 8 },
            { decimals: 0, raw: -42n, signedness: 'signed' as const, totalBits: 8 },
            { decimals: 2, raw: 4250n, signedness: 'unsigned' as const, totalBits: 64 },
            { decimals: 6, raw: 100_123_456n, signedness: 'unsigned' as const, totalBits: 64 },
            { decimals: 18, raw: 100_123_456_789_012_345_678n, signedness: 'unsigned' as const, totalBits: 128 },
            { decimals: 2, raw: -1234567n, signedness: 'signed' as const, totalBits: 64 },
        ])(
            'round-trips $signedness $totalBits-bit values with $decimals decimals (raw $raw)',
            ({ signedness, totalBits, decimals, raw }) => {
                const codec = getDecimalFixedPointCodec(signedness, totalBits, decimals, { endian });
                const value = rawDecimalFixedPoint(signedness, totalBits, decimals)(raw);
                const decoded = codec.decode(codec.encode(value));
                expect(decoded.raw).toBe(raw);
                expect(decoded.signedness).toBe(signedness);
                expect(decoded.totalBits).toBe(totalBits);
                expect(decoded.decimals).toBe(decimals);
            },
        );
    });
});
