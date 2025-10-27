import {
    combineCodec,
    createDecoder,
    createEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getHiddenPrefixDecoder } from '@solana/codecs-data-structures';
import { getU8Decoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, SolanaError } from '@solana/errors';

import { OffchainMessage } from '../message';
import { getOffchainMessageV0Decoder, getOffchainMessageV0Encoder } from './message-v0';
import { getOffchainMessageSigningDomainDecoder } from './signing-domain';

/**
 * Returns a decoder that you can use to convert a byte array (eg. one that conforms to the
 * {@link OffchainMessageBytes} type) to an {@link OffchainMessage} object.
 *
 * @example
 * ```ts
 * import { getOffchainMessageDecoder } from '@solana/offchain-messages';
 *
 * const offchainMessageDecoder = getOffchainMessageDecoder();
 * const offchainMessage = offchainMessageDecoder.decode(
 *     offchainMessageEnvelope.content,
 * );
 * console.log(`Decoded an offchain message (version: ${offchainMessage.version}`);
 * ```
 *
 * @remarks
 * If the offchain message version is known ahead of time, use one of the decoders specific to that
 * version so as not to bundle more code than you need.
 */
export function getOffchainMessageDecoder(): VariableSizeDecoder<OffchainMessage> {
    return createDecoder({
        read(bytes, offset) {
            const version = getHiddenPrefixDecoder(getU8Decoder(), [
                // Discard the signing domain
                getOffchainMessageSigningDomainDecoder(),
            ]).decode(bytes, offset);
            switch (version) {
                case 0:
                    return getOffchainMessageV0Decoder().read(bytes, offset);
                default:
                    throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                        unsupportedVersion: version,
                    });
            }
        },
    });
}

/**
 * Returns an encoder that you can use to encode an {@link OffchainMessage} to a byte array
 * appropriate for inclusion in an {@link OffchainMessageEnvelope}.
 *
 * @remarks
 * If the offchain message version is known ahead of time, use one of the encoders specific to that
 * version so as not to bundle more code than you need.
 */
export function getOffchainMessageEncoder(): VariableSizeEncoder<OffchainMessage> {
    return createEncoder({
        getSizeFromValue: offchainMessage => {
            switch (offchainMessage.version) {
                case 0:
                    return getOffchainMessageV0Encoder().getSizeFromValue(offchainMessage);
                default:
                    throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                        unsupportedVersion: offchainMessage.version satisfies never,
                    });
            }
        },
        write: (offchainMessage, bytes, offset) => {
            switch (offchainMessage.version) {
                case 0:
                    return getOffchainMessageV0Encoder().write(offchainMessage, bytes, offset);
                default:
                    throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                        unsupportedVersion: offchainMessage.version satisfies never,
                    });
            }
        },
    });
}

/**
 * Returns a codec that you can use to encode from or decode to an {@link OffchainMessage}
 *
 * @see {@link getOffchainMessageDecoder}
 * @see {@link getOffchainMessageEncoder}
 *
 * @remarks
 * If the offchain message version is known ahead of time, use one of the codecs specific to that
 * version so as not to bundle more code than you need.
 */
export function getOffchainMessageCodec(): VariableSizeCodec<OffchainMessage> {
    return combineCodec(getOffchainMessageEncoder(), getOffchainMessageDecoder());
}
