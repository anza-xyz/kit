import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY,
    SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH,
    SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_FRACTIONAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH,
    SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED,
    SolanaError,
} from '@solana/errors';

import {
    binaryFixedPoint,
    getBinaryFixedPointCodec,
    getBinaryFixedPointDecoder,
    getBinaryFixedPointEncoder,
    rawBinaryFixedPoint,
} from '../binary';

describe('getBinaryFixedPointEncoder', () => {
    it('encodes an unsigned 8-bit value', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 8, 0);
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 8, 0)(42n))).toEqual(new Uint8Array([0x2a]));
    });

    it("encodes a signed 8-bit negative value using two's-complement", () => {
        const encoder = getBinaryFixedPointEncoder('signed', 8, 0);
        expect(encoder.encode(rawBinaryFixedPoint('signed', 8, 0)(-1n))).toEqual(new Uint8Array([0xff]));
    });

    it('encodes a signed 16-bit value at 15 fractional bits in little-endian by default', () => {
        const encoder = getBinaryFixedPointEncoder('signed', 16, 15);
        expect(encoder.encode(binaryFixedPoint('signed', 16, 15)('0.5'))).toEqual(new Uint8Array([0x00, 0x40]));
    });

    it('encodes a signed 16-bit negative value at 15 fractional bits in little-endian', () => {
        const encoder = getBinaryFixedPointEncoder('signed', 16, 15);
        expect(encoder.encode(binaryFixedPoint('signed', 16, 15)('-0.5'))).toEqual(new Uint8Array([0x00, 0xc0]));
    });

    it('encodes in big-endian when configured', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 16, 0, { endian: 'be' });
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 16, 0)(0x1234n))).toEqual(new Uint8Array([0x12, 0x34]));
    });

    it('encodes an unsigned 24-bit value (byte-aligned width without a matching number codec)', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 24, 0);
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 24, 0)(0xabcdefn))).toEqual(
            new Uint8Array([0xef, 0xcd, 0xab]),
        );
    });

    it('encodes an unsigned 24-bit value in big-endian (exercises residual positioning)', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 24, 0, { endian: 'be' });
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 24, 0)(0xabcdefn))).toEqual(
            new Uint8Array([0xab, 0xcd, 0xef]),
        );
    });

    it('encodes an unsigned 72-bit value in little-endian (exercises one full chunk + one residual byte)', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 72, 0);
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 72, 0)(0x112233445566778899n))).toEqual(
            new Uint8Array([0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11]),
        );
    });

    it('encodes an unsigned 72-bit value in big-endian (exercises one full chunk + one residual byte)', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 72, 0, { endian: 'be' });
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 72, 0)(0x112233445566778899n))).toEqual(
            new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99]),
        );
    });

    it('encodes an unsigned 40-bit value in little-endian (residual = 32-bit + 8-bit)', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 40, 0);
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 40, 0)(0x1122334455n))).toEqual(
            new Uint8Array([0x55, 0x44, 0x33, 0x22, 0x11]),
        );
    });

    it('encodes an unsigned 40-bit value in big-endian (residual = 32-bit + 8-bit)', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 40, 0, { endian: 'be' });
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 40, 0)(0x1122334455n))).toEqual(
            new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55]),
        );
    });

    it('encodes an unsigned 48-bit value in little-endian (residual = 32-bit + 16-bit)', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 48, 0);
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 48, 0)(0x112233445566n))).toEqual(
            new Uint8Array([0x66, 0x55, 0x44, 0x33, 0x22, 0x11]),
        );
    });

    it('encodes an unsigned 48-bit value in big-endian (residual = 32-bit + 16-bit)', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 48, 0, { endian: 'be' });
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 48, 0)(0x112233445566n))).toEqual(
            new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66]),
        );
    });

    it('encodes an unsigned 56-bit value in little-endian (residual = 32-bit + 16-bit + 8-bit)', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 56, 0);
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 56, 0)(0x11223344556677n))).toEqual(
            new Uint8Array([0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11]),
        );
    });

    it('encodes an unsigned 56-bit value in big-endian (residual = 32-bit + 16-bit + 8-bit)', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 56, 0, { endian: 'be' });
        expect(encoder.encode(rawBinaryFixedPoint('unsigned', 56, 0)(0x11223344556677n))).toEqual(
            new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77]),
        );
    });

    it('encodes an unsigned 128-bit value in little-endian', () => {
        const encoder = getBinaryFixedPointEncoder('unsigned', 128, 0);
        const bytes = encoder.encode(rawBinaryFixedPoint('unsigned', 128, 0)(0x0102030405060708090a0b0c0d0e0f10n));
        expect(bytes).toEqual(
            new Uint8Array([
                0x10, 0x0f, 0x0e, 0x0d, 0x0c, 0x0b, 0x0a, 0x09, 0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01,
            ]),
        );
    });

    it('reports the correct fixed size', () => {
        expect(getBinaryFixedPointEncoder('signed', 16, 15).fixedSize).toBe(2);
        expect(getBinaryFixedPointEncoder('unsigned', 128, 0).fixedSize).toBe(16);
    });

    it('throws TOTAL_BITS_NOT_BYTE_ALIGNED for a non-byte-aligned total bits', () => {
        expect(() => getBinaryFixedPointEncoder('unsigned', 12, 4)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED, {
                kind: 'binaryFixedPoint',
                totalBits: 12,
            }),
        );
    });

    it('throws INVALID_TOTAL_BITS for a non-positive total bits', () => {
        expect(() => getBinaryFixedPointEncoder('unsigned', 0, 0)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS, {
                kind: 'binaryFixedPoint',
                totalBits: 0,
            }),
        );
    });

    it('throws INVALID_FRACTIONAL_BITS for a negative fractional bits', () => {
        expect(() => getBinaryFixedPointEncoder('signed', 16, -1)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_FRACTIONAL_BITS, {
                fractionalBits: -1,
            }),
        );
    });

    it('throws FRACTIONAL_BITS_EXCEED_TOTAL_BITS when fractional bits exceed total bits', () => {
        expect(() => getBinaryFixedPointEncoder('signed', 8, 16)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS, {
                fractionalBits: 16,
                totalBits: 8,
            }),
        );
    });

    it('throws SHAPE_MISMATCH when encoding a value whose shape does not match the codec', () => {
        const encoder = getBinaryFixedPointEncoder('signed', 16, 15);
        const mismatched = rawBinaryFixedPoint('signed', 16, 8)(1n);
        expect(() =>
            // @ts-expect-error The value's shape does not match the codec's shape.
            encoder.encode(mismatched),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
                actualKind: 'binaryFixedPoint',
                actualScale: 8,
                actualScaleLabel: 'fractional bits',
                actualSignedness: 'signed',
                actualTotalBits: 16,
                expectedKind: 'binaryFixedPoint',
                expectedScale: 15,
                expectedScaleLabel: 'fractional bits',
                expectedSignedness: 'signed',
                expectedTotalBits: 16,
                operation: 'getBinaryFixedPointEncoder',
            }),
        );
    });
});

describe('getBinaryFixedPointDecoder', () => {
    it('decodes an unsigned 8-bit value', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 8, 0);
        expect(decoder.decode(new Uint8Array([0x2a]))).toEqual({
            fractionalBits: 0,
            kind: 'binaryFixedPoint',
            raw: 42n,
            signedness: 'unsigned',
            totalBits: 8,
        });
    });

    it("decodes a signed 8-bit negative value via two's-complement", () => {
        const decoder = getBinaryFixedPointDecoder('signed', 8, 0);
        expect(decoder.decode(new Uint8Array([0xff])).raw).toBe(-1n);
    });

    it('decodes a signed 16-bit value at 15 fractional bits in little-endian', () => {
        const decoder = getBinaryFixedPointDecoder('signed', 16, 15);
        expect(decoder.decode(new Uint8Array([0x00, 0x40])).raw).toBe(16384n);
    });

    it('decodes a signed 16-bit negative value at 15 fractional bits in little-endian', () => {
        const decoder = getBinaryFixedPointDecoder('signed', 16, 15);
        expect(decoder.decode(new Uint8Array([0x00, 0xc0])).raw).toBe(-16384n);
    });

    it('decodes in big-endian when configured', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 16, 0, { endian: 'be' });
        expect(decoder.decode(new Uint8Array([0x12, 0x34])).raw).toBe(0x1234n);
    });

    it('decodes an unsigned 24-bit value', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 24, 0);
        expect(decoder.decode(new Uint8Array([0xef, 0xcd, 0xab])).raw).toBe(0xabcdefn);
    });

    it('decodes an unsigned 72-bit value in little-endian (exercises one full chunk + one residual byte)', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 72, 0);
        expect(decoder.decode(new Uint8Array([0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11])).raw).toBe(
            0x112233445566778899n,
        );
    });

    it('decodes an unsigned 72-bit value in big-endian (exercises one full chunk + one residual byte)', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 72, 0, { endian: 'be' });
        expect(decoder.decode(new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99])).raw).toBe(
            0x112233445566778899n,
        );
    });

    it('decodes an unsigned 40-bit value in little-endian (residual = 32-bit + 8-bit)', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 40, 0);
        expect(decoder.decode(new Uint8Array([0x55, 0x44, 0x33, 0x22, 0x11])).raw).toBe(0x1122334455n);
    });

    it('decodes an unsigned 40-bit value in big-endian (residual = 32-bit + 8-bit)', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 40, 0, { endian: 'be' });
        expect(decoder.decode(new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55])).raw).toBe(0x1122334455n);
    });

    it('decodes an unsigned 48-bit value in little-endian (residual = 32-bit + 16-bit)', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 48, 0);
        expect(decoder.decode(new Uint8Array([0x66, 0x55, 0x44, 0x33, 0x22, 0x11])).raw).toBe(0x112233445566n);
    });

    it('decodes an unsigned 48-bit value in big-endian (residual = 32-bit + 16-bit)', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 48, 0, { endian: 'be' });
        expect(decoder.decode(new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66])).raw).toBe(0x112233445566n);
    });

    it('decodes an unsigned 56-bit value in little-endian (residual = 32-bit + 16-bit + 8-bit)', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 56, 0);
        expect(decoder.decode(new Uint8Array([0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11])).raw).toBe(0x11223344556677n);
    });

    it('decodes an unsigned 56-bit value in big-endian (residual = 32-bit + 16-bit + 8-bit)', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 56, 0, { endian: 'be' });
        expect(decoder.decode(new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77])).raw).toBe(0x11223344556677n);
    });

    it('returns a frozen value', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 8, 0);
        expect(decoder.decode(new Uint8Array([0x2a]))).toBeFrozenObject();
    });

    it('throws TOTAL_BITS_NOT_BYTE_ALIGNED for a non-byte-aligned total bits', () => {
        expect(() => getBinaryFixedPointDecoder('unsigned', 12, 4)).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED, {
                kind: 'binaryFixedPoint',
                totalBits: 12,
            }),
        );
    });

    it('throws CANNOT_DECODE_EMPTY_BYTE_ARRAY when decoding from an empty buffer', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 16, 0);
        expect(() => decoder.decode(new Uint8Array([]))).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY, {
                codecDescription: 'getBinaryFixedPointDecoder',
            }),
        );
    });

    it('throws INVALID_BYTE_LENGTH when decoding from a too-short buffer', () => {
        const decoder = getBinaryFixedPointDecoder('unsigned', 32, 0);
        expect(() => decoder.decode(new Uint8Array([0x01, 0x02]))).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH, {
                bytesLength: 2,
                codecDescription: 'getBinaryFixedPointDecoder',
                expected: 4,
            }),
        );
    });
});

describe('getBinaryFixedPointCodec', () => {
    describe.each([{ endian: 'le' as const }, { endian: 'be' as const }])('under $endian endianness', ({ endian }) => {
        it.each([
            { fractionalBits: 0, raw: 42n, signedness: 'signed' as const, totalBits: 8 },
            { fractionalBits: 0, raw: -42n, signedness: 'signed' as const, totalBits: 8 },
            { fractionalBits: 15, raw: 16384n, signedness: 'signed' as const, totalBits: 16 },
            { fractionalBits: 15, raw: -16384n, signedness: 'signed' as const, totalBits: 16 },
            // 24 bits exercises the all-residual path (no full 8-byte chunks).
            { fractionalBits: 0, raw: 0xabcdefn, signedness: 'unsigned' as const, totalBits: 24 },
            { fractionalBits: 0, raw: -0xabcden, signedness: 'signed' as const, totalBits: 24 },
            { fractionalBits: 0, raw: 0xffffffffn, signedness: 'unsigned' as const, totalBits: 32 },
            // 40/48/56 bits exercise the greedy residual (32+8, 32+16, 32+16+8).
            { fractionalBits: 0, raw: 0x1122334455n, signedness: 'unsigned' as const, totalBits: 40 },
            { fractionalBits: 0, raw: 0x112233445566n, signedness: 'unsigned' as const, totalBits: 48 },
            { fractionalBits: 0, raw: 0x11223344556677n, signedness: 'unsigned' as const, totalBits: 56 },
            { fractionalBits: 0, raw: 0x0123456789abcdefn, signedness: 'signed' as const, totalBits: 64 },
            // 72 bits exercises one full chunk + one residual byte.
            { fractionalBits: 0, raw: 0x112233445566778899n, signedness: 'unsigned' as const, totalBits: 72 },
            {
                fractionalBits: 0,
                raw: 0x00112233445566778899aabbccddeeffn,
                signedness: 'unsigned' as const,
                totalBits: 128,
            },
            // 136 bits exercises two full chunks + one residual byte.
            {
                fractionalBits: 0,
                raw: 0x0102030405060708091011121314151617n,
                signedness: 'unsigned' as const,
                totalBits: 136,
            },
        ])(
            'round-trips $signedness $totalBits-bit values with $fractionalBits fractional bits (raw $raw)',
            ({ signedness, totalBits, fractionalBits, raw }) => {
                const codec = getBinaryFixedPointCodec(signedness, totalBits, fractionalBits, { endian });
                const value = rawBinaryFixedPoint(signedness, totalBits, fractionalBits)(raw);
                const decoded = codec.decode(codec.encode(value));
                expect(decoded.raw).toBe(raw);
                expect(decoded.signedness).toBe(signedness);
                expect(decoded.totalBits).toBe(totalBits);
                expect(decoded.fractionalBits).toBe(fractionalBits);
            },
        );
    });

    it('produces the same bytes as a straightforward u16 serialization for unsigned 16-bit values', () => {
        // This interop check ensures the codec is wire-compatible with standard u16 little-endian layouts.
        const codec = getBinaryFixedPointCodec('unsigned', 16, 0);
        const encoded = codec.encode(rawBinaryFixedPoint('unsigned', 16, 0)(0xbeefn));
        expect(encoded).toEqual(new Uint8Array([0xef, 0xbe]));
    });
});
