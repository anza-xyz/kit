import { getAddressDecoder, getAddressEncoder } from '@solana/addresses';
import {
    combineCodec,
    createDecoder,
    transformEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getArrayDecoder, getArrayEncoder, getStructDecoder, getStructEncoder } from '@solana/codecs-data-structures';
import { getU8Decoder, getU8Encoder, getU32Decoder, getU32Encoder } from '@solana/codecs-numbers';

import { CompiledTransactionMessageWithLifetime, V1CompiledTransactionMessage } from '../..';
import { InstructionPayload } from '../../compile/v1/instructions';
import { getMessageHeaderDecoder, getMessageHeaderEncoder } from '../legacy/header';
import { getLifetimeTokenDecoder, getLifetimeTokenEncoder } from '../legacy/lifetime-token';
import { getTransactionVersionDecoder, getTransactionVersionEncoder } from '../transaction-version';
import { getCompiledTransactionConfigValuesDecoder, getCompiledTransactionConfigValuesEncoder } from './config';
import {
    getInstructionHeaderDecoder,
    getInstructionHeaderEncoder,
    getInstructionPayloadDecoder,
    getInstructionPayloadEncoder,
} from './instruction';

export function getMessageEncoder(): VariableSizeEncoder<
    V1CompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage)
> {
    return transformEncoder(
        getStructEncoder([
            ['version', getTransactionVersionEncoder()],
            ['header', getMessageHeaderEncoder()],
            ['configMask', getU32Encoder()],
            ['lifetimeToken', getLifetimeTokenEncoder()],
            ['numInstructions', getU8Encoder()],
            ['numStaticAccounts', getU8Encoder()],
            ['staticAccounts', getArrayEncoder(getAddressEncoder(), { size: 'remainder' })],
            ['configValues', getCompiledTransactionConfigValuesEncoder()],
            ['instructionHeaders', getArrayEncoder(getInstructionHeaderEncoder(), { size: 'remainder' })],
            ['instructionPayloads', getArrayEncoder(getInstructionPayloadEncoder(), { size: 'remainder' })],
        ]),
        value => ({
            ...value,
            lifetimeToken: 'lifetimeToken' in value ? value.lifetimeToken : undefined,
        }),
    );
}

export function getMessageDecoder(): VariableSizeDecoder<
    CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage
> {
    return createDecoder({
        read(bytes, offset) {
            const [{ header, configMask, lifetimeToken, numInstructions, numStaticAccounts }, afterFixedFields] =
                getStructDecoder([
                    ['version', getTransactionVersionDecoder()],
                    ['header', getMessageHeaderDecoder()],
                    ['configMask', getU32Decoder()],
                    ['lifetimeToken', getLifetimeTokenDecoder()],
                    ['numInstructions', getU8Decoder()],
                    ['numStaticAccounts', getU8Decoder()],
                ]).read(bytes, offset);

            let nextOffset = afterFixedFields;
            const [staticAccounts, afterAddresses] = getArrayDecoder(getAddressDecoder(), {
                size: numStaticAccounts,
            }).read(bytes, nextOffset);
            nextOffset = afterAddresses;

            const [configValues, afterConfig] = getCompiledTransactionConfigValuesDecoder(configMask).read(
                bytes,
                nextOffset,
            );
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
