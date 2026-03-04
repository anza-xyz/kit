import { getAddressDecoder, getAddressEncoder } from '@solana/addresses';
import {
    combineCodec,
    createDecoder,
    createEncoder,
    transformEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getArrayDecoder, getArrayEncoder, getStructEncoder } from '@solana/codecs-data-structures';
import { getU8Decoder, getU8Encoder, getU32Decoder, getU32Encoder } from '@solana/codecs-numbers';

import { CompiledTransactionMessageWithLifetime, V1CompiledTransactionMessage } from '../..';
import { InstructionPayload } from '../../compile/v1/instructions';
import { getMessageHeaderDecoder, getMessageHeaderEncoder } from '../legacy/header';
import { getLifetimeTokenDecoder, getLifetimeTokenEncoder } from '../legacy/lifetime-token';
import { getTransactionVersionDecoder, getTransactionVersionEncoder } from '../transaction-version';
import { getConfigValuesDecoder, getConfigValuesEncoder } from './config';
import {
    getInstructionHeaderDecoder,
    getInstructionHeaderEncoder,
    getInstructionPayloadDecoder,
    getInstructionPayloadEncoder,
} from './instruction';

function getMessageEncoderForMessage(
    message: V1CompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage),
) {
    return transformEncoder(
        getStructEncoder([
            ['version', getTransactionVersionEncoder()],
            ['header', getMessageHeaderEncoder()],
            ['configMask', getU32Encoder()],
            ['lifetimeToken', getLifetimeTokenEncoder()],
            ['numInstructions', getU8Encoder()],
            ['numStaticAccounts', getU8Encoder()],
            ['staticAccounts', getArrayEncoder(getAddressEncoder(), { size: message.numStaticAccounts })],
            ['configValues', getConfigValuesEncoder()],
            ['instructionHeaders', getArrayEncoder(getInstructionHeaderEncoder(), { size: message.numInstructions })],
            ['instructionPayloads', getArrayEncoder(getInstructionPayloadEncoder(), { size: message.numInstructions })],
        ]),
        (value: typeof message) => ({
            ...value,
            lifetimeToken: 'lifetimeToken' in value ? value.lifetimeToken : undefined,
        }),
    );
}

export function getMessageEncoder(): VariableSizeEncoder<
    V1CompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage)
> {
    return createEncoder({
        getSizeFromValue(message) {
            return getMessageEncoderForMessage(message).getSizeFromValue(message);
        },
        write(message, bytes, offset) {
            return getMessageEncoderForMessage(message).write(message, bytes, offset);
        },
    });
}

export function getMessageDecoder(): VariableSizeDecoder<
    CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage
> {
    return createDecoder({
        read(bytes, offset) {
            let nextOffset = offset;

            const [_version, afterVersion] = getTransactionVersionDecoder().read(bytes, nextOffset);
            nextOffset = afterVersion;

            const [header, afterHeader] = getMessageHeaderDecoder().read(bytes, nextOffset);
            nextOffset = afterHeader;

            const [configMask, afterMask] = getU32Decoder().read(bytes, nextOffset);
            nextOffset = afterMask;

            const [lifetimeToken, afterLifetime] = getLifetimeTokenDecoder().read(bytes, nextOffset);
            nextOffset = afterLifetime;

            const [numInstructions, afterNumIx] = getU8Decoder().read(bytes, nextOffset);
            nextOffset = afterNumIx;

            const [numStaticAccounts, afterNumAddr] = getU8Decoder().read(bytes, nextOffset);
            nextOffset = afterNumAddr;

            const [staticAccounts, afterAddresses] = getArrayDecoder(getAddressDecoder(), {
                size: numStaticAccounts,
            }).read(bytes, nextOffset);
            nextOffset = afterAddresses;

            const [configValues, afterConfig] = getConfigValuesDecoder(configMask).read(bytes, nextOffset);
            nextOffset = afterConfig;

            const [instructionHeaders, afterHeaders] = getArrayDecoder(getInstructionHeaderDecoder(), {
                size: numInstructions,
            }).read(bytes, nextOffset);
            nextOffset = afterHeaders;

            const instructionPayloads: InstructionPayload[] = [];
            for (const header of instructionHeaders) {
                const [payload, next] = getInstructionPayloadDecoder(header).read(bytes, nextOffset);
                instructionPayloads.push(payload);
                nextOffset = next;
            }

            const compiledMessage: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                configMask,
                configValues,
                header,
                instructionHeaders,
                instructionPayloads,
                lifetimeToken,
                numInstructions,
                numStaticAccounts,
                staticAccounts,
                version: 1,
            };

            return [compiledMessage, nextOffset];
        },
    });
}

export function getMessageCodec(): VariableSizeCodec<
    V1CompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage),
    CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage
> {
    return combineCodec(getMessageEncoder(), getMessageDecoder());
}
