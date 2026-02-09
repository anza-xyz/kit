import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';
import { getU8Decoder, getU8Encoder } from '@solana/codecs-numbers';

import { OffchainMessageContentFormat } from '../content';

function encodeOffchainMessageContentFormat(format: OffchainMessageContentFormat): number {
    switch (format) {
        case 'RESTRICTED_ASCII_1232_BYTES_MAX':
            return 0;
        case 'UTF8_1232_BYTES_MAX':
            return 1;
        case 'UTF8_65535_BYTES_MAX':
            return 2;
        default: {
            const _exhaustive: never = format;
            return _exhaustive;
        }
    }
}

/**
 * Decode on-wire u8 discriminator into
 * OffchainMessageContentFormat.
 */
function decodeOffchainMessageContentFormat(value: number): OffchainMessageContentFormat {
    switch (value) {
        case 0:
            return 'RESTRICTED_ASCII_1232_BYTES_MAX';
        case 1:
            return 'UTF8_1232_BYTES_MAX';
        case 2:
            return 'UTF8_65535_BYTES_MAX';
        default:
            throw new Error(`Invalid OffchainMessageContentFormat discriminator: ${value}`);
    }
}

export function getOffchainMessageContentFormatEncoder(): FixedSizeEncoder<OffchainMessageContentFormat, 1> {
    const u8 = getU8Encoder();

    return {
        encode(value) {
            return u8.encode(encodeOffchainMessageContentFormat(value));
        },
        fixedSize: 1,

        write(value, buffer, offset) {
            return u8.write(encodeOffchainMessageContentFormat(value), buffer, offset);
        },
    };
}

export function getOffchainMessageContentFormatDecoder(): FixedSizeDecoder<OffchainMessageContentFormat, 1> {
    const u8 = getU8Decoder();

    return {
        decode(bytes, offset) {
            return decodeOffchainMessageContentFormat(u8.decode(bytes, offset));
        },
        fixedSize: 1,

        read(bytes, offset) {
            const [value, newOffset] = u8.read(bytes, offset);
            return [decodeOffchainMessageContentFormat(value), newOffset];
        },
    };
}

export function getOffchainMessageContentFormatCodec(): FixedSizeCodec<
    OffchainMessageContentFormat,
    OffchainMessageContentFormat,
    1
> {
    return combineCodec(getOffchainMessageContentFormatEncoder(), getOffchainMessageContentFormatDecoder());
}
