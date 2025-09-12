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
import {
    SOLANA_ERROR__INVARIANT_VIOLATION__SWITCH_MUST_BE_EXHAUSTIVE,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_LENGTH_MISMATCH,
    SolanaError,
} from '@solana/errors';

import { OffchainMessageContentFormat } from '../content';
import {
    assertIsOffchainMessageRestrictedAsciiOf1232BytesMax,
    assertIsOffchainMessageUtf8Of1232BytesMax,
    assertIsOffchainMessageUtf8Of65535BytesMax,
    OffchainMessage,
} from '../message';
import { getOffchainMessagePreambleDecoder, getOffchainMessagePreambleEncoder } from './preamble';

export function getOffchainMessageDecoder(): VariableSizeDecoder<OffchainMessage> {
    return transformDecoder(
        getTupleDecoder([getOffchainMessagePreambleDecoder(), getUtf8Decoder()]),
        ([{ messageLength, messageFormat, requiredSigners, ...preambleRest }, text]) => {
            const actualLength = getUtf8Encoder().getSizeFromValue(text);
            if (messageLength !== actualLength) {
                throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_LENGTH_MISMATCH, {
                    actualLength: actualLength,
                    specifiedLength: messageLength,
                });
            }
            const offchainMessage: Omit<OffchainMessage, 'content'> &
                Readonly<{
                    content: {
                        format: OffchainMessageContentFormat;
                        text: string;
                    };
                }> = Object.freeze({
                ...preambleRest,
                content: Object.freeze({
                    format: messageFormat,
                    text,
                }),
                requiredSigners: Object.freeze(requiredSigners),
            });
            switch (messageFormat) {
                case OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX: {
                    assertIsOffchainMessageRestrictedAsciiOf1232BytesMax(offchainMessage);
                    return offchainMessage;
                }
                case OffchainMessageContentFormat.UTF8_1232_BYTES_MAX: {
                    assertIsOffchainMessageUtf8Of1232BytesMax(offchainMessage);
                    return offchainMessage;
                }
                case OffchainMessageContentFormat.UTF8_65535_BYTES_MAX: {
                    assertIsOffchainMessageUtf8Of65535BytesMax(offchainMessage);
                    return offchainMessage;
                }
                default: {
                    throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__SWITCH_MUST_BE_EXHAUSTIVE, {
                        unexpectedValue: messageFormat satisfies never,
                    });
                }
            }
        },
    );
}

export function getOffchainMessageEncoder(): VariableSizeEncoder<OffchainMessage> {
    return transformEncoder(
        getTupleEncoder([getOffchainMessagePreambleEncoder(), getUtf8Encoder()]),
        offchainMessage => {
            const { content, ...preamble } = offchainMessage;
            switch (offchainMessage.content.format) {
                case OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX: {
                    assertIsOffchainMessageRestrictedAsciiOf1232BytesMax(offchainMessage);
                    break;
                }
                case OffchainMessageContentFormat.UTF8_1232_BYTES_MAX: {
                    assertIsOffchainMessageUtf8Of1232BytesMax(offchainMessage);
                    break;
                }
                case OffchainMessageContentFormat.UTF8_65535_BYTES_MAX: {
                    assertIsOffchainMessageUtf8Of65535BytesMax(offchainMessage);
                    break;
                }
                default: {
                    throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__SWITCH_MUST_BE_EXHAUSTIVE, {
                        unexpectedValue: offchainMessage.content satisfies never,
                    });
                }
            }
            const messageLength = getUtf8Encoder().getSizeFromValue(content.text);
            const compiledPreamble = {
                ...preamble,
                messageFormat: content.format,
                messageLength,
            };
            return [compiledPreamble, content.text] as const;
        },
    );
}

export function getOffchainMessageCodec(): VariableSizeCodec<OffchainMessage> {
    return combineCodec(getOffchainMessageEncoder(), getOffchainMessageDecoder());
}
