import { addCodecSizePrefix, fixCodecSize, offsetCodec, resizeCodec } from '@solana/codecs-core';
import { Endian, getU8Codec, getU16Codec, getU32Codec, getU64Codec } from '@solana/codecs-numbers';
import { getUtf8Codec } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY,
    SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH,
    SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS,
    SOLANA_ERROR__CODECS__SENTINEL_MISSING_AT_END_OF_BYTES,
    SOLANA_ERROR__CODECS__SENTINEL_MUST_NOT_BE_EMPTY,
    SolanaError,
} from '@solana/errors';

import { getArrayCodec, getArrayDecoder, getArrayEncoder } from '../array';
import { b } from './__setup__';

describe('getArrayCodec', () => {
    const array = getArrayCodec;
    const u8 = getU8Codec;
    const u16 = getU16Codec;
    const u64 = getU64Codec;

    it('encodes prefixed arrays', () => {
        // Empty.
        expect(array(u8()).encode([])).toStrictEqual(b('00000000')); // 4-bytes prefix.
        expect(array(u8()).read(b('00000000'), 0)).toStrictEqual([[], 4]);

        // Empty with custom prefix.
        expect(array(u8(), { size: u8() }).encode([])).toStrictEqual(b('00')); // 1-byte prefix.
        expect(array(u8(), { size: u8() }).read(b('00'), 0)).toStrictEqual([[], 1]);

        // Numbers.
        expect(array(u8()).encode([42, 1, 2])).toStrictEqual(b('030000002a0102'));
        expect(array(u8()).read(b('030000002a0102'), 0)).toStrictEqual([[42, 1, 2], 4 + 3]);
        expect(array(u8()).read(b('ffff030000002a0102'), 2)).toStrictEqual([[42, 1, 2], 2 + 4 + 3]);

        // Strings.
        const u32String = addCodecSizePrefix(getUtf8Codec(), getU32Codec());
        expect(array(u32String).encode(['a', 'b'])).toStrictEqual(b('0200000001000000610100000062'));
        expect(array(u32String).read(b('0200000001000000610100000062'), 0)).toStrictEqual([['a', 'b'], 4 + 10]);

        // Different From and To types.
        const arrayU64 = array<bigint | number, bigint>(u64());
        expect(arrayU64.encode([2])).toStrictEqual(b('010000000200000000000000'));
        expect(arrayU64.encode([2n])).toStrictEqual(b('010000000200000000000000'));
        expect(arrayU64.read(b('010000000200000000000000'), 0)).toStrictEqual([[2n], 4 + 8]);
    });

    it('encodes fixed arrays', () => {
        // Empty.
        expect(array(u8(), { size: 0 }).encode([])).toStrictEqual(b(''));
        expect(array(u8(), { size: 0 }).read(b(''), 0)).toStrictEqual([[], 0]);

        // Numbers.
        expect(array(u8(), { size: 3 }).encode([42, 1, 2])).toStrictEqual(b('2a0102'));
        expect(array(u8(), { size: 3 }).read(b('2a0102'), 0)).toStrictEqual([[42, 1, 2], 3]);
        expect(array(u8(), { size: 3 }).read(b('ffff2a0102'), 2)).toStrictEqual([[42, 1, 2], 5]);

        // Strings.
        const u32String = addCodecSizePrefix(getUtf8Codec(), getU32Codec());
        expect(array(u32String, { size: 2 }).encode(['a', 'b'])).toStrictEqual(b('01000000610100000062'));
        expect(array(u32String, { size: 2 }).read(b('01000000610100000062'), 0)).toStrictEqual([['a', 'b'], 10]);

        // Different From and To types.
        const arrayU64 = array<bigint | number, bigint>(u64(), { size: 1 });
        expect(arrayU64.encode([2])).toStrictEqual(b('0200000000000000'));
        expect(arrayU64.encode([2n])).toStrictEqual(b('0200000000000000'));
        expect(arrayU64.read(b('0200000000000000'), 0)).toStrictEqual([[2n], 8]);

        // It fails if the array has a different size.
        expect(() => array(u32String, { size: 1 }).encode([])).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS, {
                actual: 0,
                codecDescription: 'array',
                expected: 1,
            }),
        );
        expect(() => array(u32String, { size: 2 }).encode(['a', 'b', 'c'])).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS, {
                actual: 3,
                codecDescription: 'array',
                expected: 2,
            }),
        );

        expect(() => array(u32String, { description: 'myDescription', size: 2 }).encode(['a', 'b', 'c'])).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS, {
                actual: 3,
                codecDescription: 'myDescription',
                expected: 2,
            }),
        );
    });

    it('encodes remainder arrays', () => {
        const remainder = { size: 'remainder' } as const;

        // Empty.
        expect(array(u8(), remainder).encode([])).toStrictEqual(b(''));
        expect(array(u8(), remainder).read(b(''), 0)).toStrictEqual([[], 0]);

        // Numbers.
        expect(array(u8(), remainder).encode([42, 1, 2])).toStrictEqual(b('2a0102'));
        expect(array(u8(), remainder).read(b('2a0102'), 0)).toStrictEqual([[42, 1, 2], 3]);
        expect(array(u8(), remainder).read(b('ffff2a0102'), 2)).toStrictEqual([[42, 1, 2], 5]);

        // Strings.
        const charString = fixCodecSize(getUtf8Codec(), 1);
        expect(array(charString, remainder).encode(['a', 'b'])).toStrictEqual(b('6162'));
        expect(array(charString, remainder).read(b('6162'), 0)).toStrictEqual([['a', 'b'], 2]);

        // Variable sized items.
        const u8String = addCodecSizePrefix(getUtf8Codec(), getU8Codec());
        expect(array(u8String, remainder).encode(['a', 'bc'])).toStrictEqual(b('0161026263'));
        expect(array(u8String, remainder).read(b('0161026263'), 0)).toStrictEqual([['a', 'bc'], 5]);

        // Different From and To types.
        const arrayU64 = array<bigint | number, bigint>(u64(), remainder);
        expect(arrayU64.encode([2])).toStrictEqual(b('0200000000000000'));
        expect(arrayU64.encode([2n])).toStrictEqual(b('0200000000000000'));
        expect(arrayU64.read(b('0200000000000000'), 0)).toStrictEqual([[2n], 8]);
    });

    it('encodes sentinel-terminated arrays with the required strategy by default', () => {
        const sentinel = { __kind: 'sentinel', sentinel: b('00') } as const;

        // Empty (writes only the sentinel).
        expect(array(u8(), { size: sentinel }).encode([])).toStrictEqual(b('00'));
        expect(array(u8(), { size: sentinel }).read(b('00'), 0)).toStrictEqual([[], 1]);

        // Numbers (the sentinel is appended after the items).
        expect(array(u8(), { size: sentinel }).encode([42, 1, 2])).toStrictEqual(b('2a010200'));
        expect(array(u8(), { size: sentinel }).read(b('2a010200'), 0)).toStrictEqual([[42, 1, 2], 4]);
        expect(array(u8(), { size: sentinel }).read(b('ffff2a010200'), 2)).toStrictEqual([[42, 1, 2], 6]);

        // Multi-byte sentinels.
        const wide = { __kind: 'sentinel', sentinel: b('ffff') } as const;
        expect(array(u8(), { size: wide }).encode([42, 1, 2])).toStrictEqual(b('2a0102ffff'));
        expect(array(u8(), { size: wide }).read(b('2a0102ffff'), 0)).toStrictEqual([[42, 1, 2], 5]);

        // The sentinel is only compared at item boundaries, so it may legitimately appear inside an item.
        // Here each big-endian u16 item contains a `00` byte (e.g. `256` encodes to `0100`), which is
        // the sentinel — yet decoding does not stop mid-item because only item boundaries are checked.
        // Note that this only holds because every item is >= 256; a value in [0, 255] would encode to
        // `00xx`, starting with the sentinel byte and terminating the array early (see invariant 1).
        const u16Be = getU16Codec({ endian: Endian.Big });
        const sentinelByte = { __kind: 'sentinel', sentinel: b('00') } as const;
        expect(array(u16Be, { size: sentinelByte }).encode([256, 258])).toStrictEqual(b('0100010200'));
        expect(array(u16Be, { size: sentinelByte }).read(b('0100010200'), 0)).toStrictEqual([[256, 258], 5]);

        // Fails when the sentinel is missing and the strategy is required.
        expect(() => array(u8(), { size: sentinel }).read(b('2a0102'), 0)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__SENTINEL_MISSING_AT_END_OF_BYTES, {
                codecDescription: 'array',
                hexSentinel: '00',
                sentinel: b('00'),
            }),
        );

        // The codec description is used in the error when provided.
        expect(() => array(u8(), { description: 'myList', size: sentinel }).read(b('2a0102'), 0)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__SENTINEL_MISSING_AT_END_OF_BYTES, {
                codecDescription: 'myList',
                hexSentinel: '00',
                sentinel: b('00'),
            }),
        );
    });

    it('encodes sentinel-terminated arrays with the optional strategy', () => {
        const optional = { __kind: 'sentinel', sentinel: b('00'), strategy: 'optional' } as const;

        // The sentinel is written when encoding.
        expect(array(u8(), { size: optional }).encode([42, 1, 2])).toStrictEqual(b('2a010200'));

        // The sentinel is consumed when present.
        expect(array(u8(), { size: optional }).read(b('2a010200'), 0)).toStrictEqual([[42, 1, 2], 4]);

        // A missing sentinel is tolerated: the array ends at the end of the byte array.
        expect(array(u8(), { size: optional }).read(b('2a0102'), 0)).toStrictEqual([[42, 1, 2], 3]);
        expect(array(u8(), { size: optional }).read(b(''), 0)).toStrictEqual([[], 0]);
    });

    it('encodes sentinel-terminated arrays with the omitted strategy', () => {
        const omitted = { __kind: 'sentinel', sentinel: b('00'), strategy: 'omitted' } as const;

        // The sentinel is never written when encoding.
        expect(array(u8(), { size: omitted }).encode([42, 1, 2])).toStrictEqual(b('2a0102'));
        expect(array(u8(), { size: omitted }).encode([])).toStrictEqual(b(''));

        // The array ends at the end of the byte array.
        expect(array(u8(), { size: omitted }).read(b('2a0102'), 0)).toStrictEqual([[42, 1, 2], 3]);

        // A sentinel that is present is still consumed.
        expect(array(u8(), { size: omitted }).read(b('2a010200'), 0)).toStrictEqual([[42, 1, 2], 4]);
    });

    it('rejects an empty sentinel at construction time', () => {
        // An empty sentinel cannot delimit a collection, so both the encoder and decoder throw.
        const empty = { size: { __kind: 'sentinel', sentinel: b('') } } as const;
        const expectedError = new SolanaError(SOLANA_ERROR__CODECS__SENTINEL_MUST_NOT_BE_EMPTY);
        expect(() => getArrayEncoder(u8(), empty)).toThrow(expectedError);
        expect(() => getArrayDecoder(u8(), empty)).toThrow(expectedError);
        expect(() => array(u8(), empty)).toThrow(expectedError);
    });

    it('stops decoding early when an item begins with the sentinel bytes', () => {
        // INVARIANT: no valid item may begin with the sentinel's bytes. This is the caller's
        // responsibility; the codec cannot tell a leading sentinel apart from a terminator.
        const sentinel = { __kind: 'sentinel', sentinel: b('00') } as const;

        // The sentinel bytes may appear *inside* an item without terminating the array. Here each
        // u16 item's high byte is `00`, but decoding reads all three items because the comparison
        // only happens at the start of each item slot.
        expect(array(u16(), { size: sentinel }).read(b('010002000300' + '00'), 0)).toStrictEqual([[1, 2, 3], 7]);

        // But an item that *begins* with the sentinel bytes is indistinguishable from the
        // terminator, so decoding stops at that boundary. Here `[1, 0]` would encode as `0100 0000`,
        // and decoding it back stops at the second item because it begins with `00`.
        expect(array(u16(), { size: sentinel }).read(b('01000000'), 0)).toStrictEqual([[1], 3]);
    });

    it('skips a valid short tail when an optional/omitted sentinel is wider than the smallest item', () => {
        // INVARIANT: under `optional`/`omitted`, the sentinel must be no wider than the smallest
        // possible item. Otherwise a trailing item shorter than the sentinel is never read, because
        // decoding stops as soon as fewer bytes than the sentinel remain.
        const optional = { __kind: 'sentinel', sentinel: b('ffff'), strategy: 'optional' } as const;

        // A trailing single-byte `2a` item is silently dropped because only one byte (< the 2-byte
        // sentinel) remains at its boundary, so decoding stops there without consuming it.
        expect(array(u8(), { size: optional }).read(b('01022a'), 0)).toStrictEqual([[1, 2], 2]);

        // With a sentinel no wider than the item, the same tail decodes correctly.
        const safe = { __kind: 'sentinel', sentinel: b('ff'), strategy: 'optional' } as const;
        expect(array(u8(), { size: safe }).read(b('01022a'), 0)).toStrictEqual([[1, 2, 42], 3]);
    });

    it('offsets the size of the array', () => {
        const codec = array(u8(), {
            size: offsetCodec(u8(), {
                postOffset: ({ preOffset }) => preOffset,
                preOffset: ({ wrapBytes }) => wrapBytes(-1),
            }),
        });
        expect(codec.encode([65, 66, 67])).toStrictEqual(b('41424303'));
        expect(codec.read(b('41424303'), 0)).toStrictEqual([[65, 66, 67], 3]);
        expect(codec.read(b('ffff41424303'), 2)).toStrictEqual([[65, 66, 67], 5]);
    });

    it('offsets each item in the array', () => {
        const itemCodec = offsetCodec(u8(), {
            preOffset: ({ preOffset }) => preOffset + 2,
        });
        const codec = resizeCodec(array(itemCodec), () => 13);
        expect(codec.encode([65, 66, 67])).toStrictEqual(b('03000000000041000042000043'));
        expect(codec.read(b('03000000000041000042000043'), 0)).toStrictEqual([[65, 66, 67], 13]);
        expect(codec.read(b('ffff03000000000041000042000043'), 2)).toStrictEqual([[65, 66, 67], 15]);
    });

    it('decodes an exhausted byte array as an empty array by default', () => {
        // With a size prefix, missing bytes are treated as an empty array so that
        // arrays can be appended to existing data layouts.
        expect(array(u8()).read(b(''), 0)).toStrictEqual([[], 0]);
        expect(array(u8()).read(b('ff'), 1)).toStrictEqual([[], 1]);
        expect(array(u8(), { size: u8() }).read(b(''), 0)).toStrictEqual([[], 0]);

        // Fixed and remainder sizes are not affected.
        expect(() => array(u8(), { size: 1 }).read(b(''), 0)).toThrow(SolanaError);
        expect(array(u8(), { size: 'remainder' }).read(b(''), 0)).toStrictEqual([[], 0]);

        // A required sentinel still throws on an exhausted byte array; optional and omitted do not.
        expect(() => array(u8(), { size: { __kind: 'sentinel', sentinel: b('00') } }).read(b(''), 0)).toThrow(
            SolanaError,
        );
        expect(
            array(u8(), { size: { __kind: 'sentinel', sentinel: b('00'), strategy: 'optional' } }).read(b(''), 0),
        ).toStrictEqual([[], 0]);
        expect(
            array(u8(), { size: { __kind: 'sentinel', sentinel: b('00'), strategy: 'omitted' } }).read(b(''), 0),
        ).toStrictEqual([[], 0]);
    });

    it('can require the size prefix to be present', () => {
        const strict = { requireSizePrefix: true } as const;

        // Missing prefix.
        expect(() => array(u8(), strict).read(b(''), 0)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY, { codecDescription: 'u32' }),
        );
        expect(() => array(u8(), strict).read(b('ff'), 1)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY, { codecDescription: 'u32' }),
        );
        expect(() => array(u8(), strict).read(b('0300'), 0)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH, {
                bytesLength: 2,
                codecDescription: 'u32',
                expected: 4,
            }),
        );
        expect(() => array(u8(), { ...strict, size: u8() }).read(b(''), 0)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY, { codecDescription: 'u8' }),
        );

        // Present prefix.
        expect(array(u8(), strict).read(b('00000000'), 0)).toStrictEqual([[], 4]);
        expect(array(u8(), strict).read(b('030000002a0102'), 0)).toStrictEqual([[42, 1, 2], 7]);
        expect(array(u8(), strict).encode([42, 1, 2])).toStrictEqual(b('030000002a0102'));

        // Fixed and remainder sizes are not affected.
        expect(array(u8(), { ...strict, size: 0 }).read(b(''), 0)).toStrictEqual([[], 0]);
        expect(array(u8(), { ...strict, size: 'remainder' }).read(b(''), 0)).toStrictEqual([[], 0]);
    });

    it('has the right sizes', () => {
        expect(array(u8()).getSizeFromValue([1, 2])).toBe(4 + 2);
        expect(array(u8()).maxSize).toBeUndefined();
        expect(array(u8(), { size: u8() }).getSizeFromValue([1, 2])).toBe(1 + 2);
        expect(array(u8(), { size: u8() }).maxSize).toBeUndefined();
        expect(array(u8(), { size: 'remainder' }).getSizeFromValue([1, 2])).toBe(2);
        expect(array(u8(), { size: 'remainder' }).maxSize).toBeUndefined();
        // A required or optional sentinel adds its length to the size; an omitted one does not.
        expect(array(u8(), { size: { __kind: 'sentinel', sentinel: b('00') } }).getSizeFromValue([1, 2])).toBe(2 + 1);
        expect(array(u8(), { size: { __kind: 'sentinel', sentinel: b('ffff') } }).getSizeFromValue([1, 2])).toBe(2 + 2);
        expect(
            array(u8(), { size: { __kind: 'sentinel', sentinel: b('00'), strategy: 'omitted' } }).getSizeFromValue([
                1, 2,
            ]),
        ).toBe(2);
        expect(array(u8(), { size: { __kind: 'sentinel', sentinel: b('00') } }).maxSize).toBeUndefined();
        expect(array(u8(), { size: 42 }).fixedSize).toBe(42);
        expect(array(u16(), { size: 42 }).fixedSize).toBe(2 * 42);
        const u32String = addCodecSizePrefix(getUtf8Codec(), getU32Codec());
        expect(array(u32String, { size: 42 }).maxSize).toBeUndefined();
        expect(array(u32String, { size: 0 }).fixedSize).toBe(0);
    });
});
