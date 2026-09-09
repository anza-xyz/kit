import {
    assertByteArrayHasEnoughBytesForCodec,
    assertByteArrayIsNotEmptyForCodec,
    createDecoder,
    createEncoder,
    FixedSizeDecoder,
    FixedSizeEncoder,
    Offset,
    toArrayBuffer,
} from '@solana/codecs-core';

import { assertNumberIsBetweenForCodec } from './assertions';
import { Endian, NumberCodecConfig } from './common';

type NumberFactorySharedInput<TSize extends number> = {
    config?: NumberCodecConfig;
    name: string;
    size: TSize;
};

type NumberFactoryEncoderInput<TFrom, TSize extends number> = NumberFactorySharedInput<TSize> & {
    range?: [bigint | number, bigint | number];
    set: (view: DataView, value: TFrom, littleEndian?: boolean) => void;
};

type NumberFactoryDecoderInput<TTo, TSize extends number> = NumberFactorySharedInput<TSize> & {
    get: (view: DataView, littleEndian?: boolean) => TTo;
};

function isLittleEndian(config?: NumberCodecConfig): boolean {
    return config?.endian === Endian.Big ? false : true;
}

const U64_MASK = 0xffffffffffffffffn;

/**
 * Writes a `bigint` (or `number`) into a {@link DataView} as a sequence of 64-bit words.
 *
 * This helper generalises the little/big-endian word-splitting used by multi-word integer
 * codecs such as `u128`, `i128`, `u256` and `i256`. The value is decomposed into `wordCount`
 * consecutive 64-bit words. In little-endian mode the least significant word is written first;
 * in big-endian mode the most significant word is written first. When `signed` is `true`, the
 * most significant word is written as a signed 64-bit integer so that negative values round-trip.
 *
 * @param view - The `DataView` to write into. It must be large enough to hold `wordCount * 8` bytes.
 * @param value - The value to encode, provided as either a `number` or a `bigint`.
 * @param littleEndian - Whether to write the words in little-endian order.
 * @param wordCount - The number of 64-bit words to write (e.g. `2` for 128-bit, `4` for 256-bit).
 * @param signed - Whether the most significant word should be treated as signed.
 *
 * @see {@link getBigIntWords}
 */
export function setBigIntWords(
    view: DataView,
    value: bigint | number,
    littleEndian: boolean | undefined,
    wordCount: number,
    signed: boolean,
): void {
    const bigintValue = BigInt(value);
    for (let i = 0; i < wordCount; i++) {
        // `i === 0` is the most significant word.
        const shift = BigInt((wordCount - 1 - i) * 64);
        // In little-endian, the least significant word is stored first.
        const offset = (littleEndian ? wordCount - 1 - i : i) * 8;
        // The most significant word carries the sign for signed integers. Writing it via
        // `setBigInt64` is byte-identical to `setBigUint64` of the masked value, but keeping the
        // explicit signed write documents intent and mirrors the signed branch in `getBigIntWords`.
        if (signed && i === 0) {
            view.setBigInt64(offset, bigintValue >> shift, littleEndian);
        } else {
            view.setBigUint64(offset, (bigintValue >> shift) & U64_MASK, littleEndian);
        }
    }
}

/**
 * Reads a sequence of 64-bit words from a {@link DataView} and reassembles them into a `bigint`.
 *
 * This is the counterpart to {@link setBigIntWords} and generalises the reassembly used by
 * multi-word integer codecs such as `u128`, `i128`, `u256` and `i256`. Each word is read as an
 * unsigned 64-bit integer and combined most-significant-word first. When `signed` is `true`, the
 * final value is reinterpreted as a two's-complement integer of `wordCount * 64` bits via
 * {@link BigInt.asIntN}, so that negative values decode correctly.
 *
 * @param view - The `DataView` to read from. It must contain at least `wordCount * 8` bytes.
 * @param littleEndian - Whether the words are stored in little-endian order.
 * @param wordCount - The number of 64-bit words to read (e.g. `2` for 128-bit, `4` for 256-bit).
 * @param signed - Whether the reassembled value should be interpreted as signed.
 * @returns The decoded value as a `bigint`.
 *
 * @see {@link setBigIntWords}
 */
export function getBigIntWords(
    view: DataView,
    littleEndian: boolean | undefined,
    wordCount: number,
    signed: boolean,
): bigint {
    let value = 0n;
    for (let i = 0; i < wordCount; i++) {
        // In little-endian, the least significant word is stored first.
        const offset = (littleEndian ? wordCount - 1 - i : i) * 8;
        value = (value << 64n) | view.getBigUint64(offset, littleEndian);
    }
    return signed ? BigInt.asIntN(wordCount * 64, value) : value;
}

export function numberEncoderFactory<TFrom extends bigint | number, TSize extends number>(
    input: NumberFactoryEncoderInput<TFrom, TSize>,
): FixedSizeEncoder<TFrom, TSize> {
    return createEncoder({
        fixedSize: input.size,
        write(value: TFrom, bytes: Uint8Array, offset: Offset): Offset {
            if (input.range) {
                assertNumberIsBetweenForCodec(input.name, input.range[0], input.range[1], value);
            }
            const arrayBuffer = new ArrayBuffer(input.size);
            input.set(new DataView(arrayBuffer), value, isLittleEndian(input.config));
            bytes.set(new Uint8Array(arrayBuffer), offset);
            return offset + input.size;
        },
    });
}

export function numberDecoderFactory<TTo extends bigint | number, TSize extends number>(
    input: NumberFactoryDecoderInput<TTo, TSize>,
): FixedSizeDecoder<TTo, TSize> {
    return createDecoder({
        fixedSize: input.size,
        read(bytes, offset = 0): [TTo, number] {
            assertByteArrayIsNotEmptyForCodec(input.name, bytes, offset);
            assertByteArrayHasEnoughBytesForCodec(input.name, input.size, bytes, offset);
            const view = new DataView(toArrayBuffer(bytes, offset, input.size));
            return [input.get(view, isLittleEndian(input.config)), offset + input.size];
        },
    });
}
