import {
    combineCodec,
    transformDecoder,
    transformEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getTupleDecoder, getTupleEncoder } from '@solana/codecs-data-structures';
import { getUtf8Decoder, getUtf8Encoder } from '@solana/codecs-strings';
import { SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY, SolanaError } from '@solana/errors';

import { OffchainMessageV1 } from '../message-v1';
import { getOffchainMessageV1PreambleDecoder, getOffchainMessageV1PreambleEncoder } from './preamble-v1';

/**
 * Returns a decoder that you can use to convert a byte array (eg. one that conforms to the
 * {@link OffchainMessageBytes} type) to an {@link OffchainMessageV1} object.
 *
 * @example
 * ```ts
 * import { getOffchainMessageV1Decoder } from '@solana/offchain-messages';
 *
 * const offchainMessageDecoder = getOffchainMessageV1Decoder();
 * const offchainMessage = offchainMessageDecoder.decode(
 *     offchainMessageEnvelope.content,
 * );
 * console.log(`Decoded a v1 offchain message`);
 * ```
 *
 * Throws in the event that the message bytes represent a message of a version other than 1.
 */
export function getOffchainMessageV1Decoder(): VariableSizeDecoder<OffchainMessageV1> {
    return transformDecoder(
        getTupleDecoder([getOffchainMessageV1PreambleDecoder(), getUtf8Decoder()]),
        ([{ requiredSignatories, ...preambleRest }, text]) => {
            if (text.length === 0) {
                throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY);
            }
            return Object.freeze({
                ...preambleRest,
                content: text,
                requiredSignatories: Object.freeze(requiredSignatories),
            });
        },
    );
}

/**
 * Returns an encoder that you can use to encode an {@link OffchainMessageV1} to a byte array
 * appropriate for inclusion in an {@link OffchainMessageEnvelope}.
 */
export function getOffchainMessageV1Encoder(): VariableSizeEncoder<OffchainMessageV1> {
    return transformEncoder(
        getTupleEncoder([getOffchainMessageV1PreambleEncoder(), getUtf8Encoder()]),
        offchainMessage => {
            const { content, ...compiledPreamble } = offchainMessage;
            if (content.length === 0) {
                throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY);
            }
            return [compiledPreamble, content] as const;
        },
    );
}

/**
 * Returns a codec that you can use to encode from or decode to an {@link OffchainMessageV1}
 *
 * @see {@link getOffchainMessageV1Decoder}
 * @see {@link getOffchainMessageV1Encoder}
 */
export function getOffchainMessageV1Codec(): VariableSizeCodec<OffchainMessageV1> {
    return combineCodec(getOffchainMessageV1Encoder(), getOffchainMessageV1Decoder());
}
