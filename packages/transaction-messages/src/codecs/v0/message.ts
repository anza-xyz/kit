import { getAddressDecoder, getAddressEncoder } from '@solana/addresses';
import {
    combineCodec,
    transformDecoder,
    transformEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getArrayDecoder, getArrayEncoder, getStructDecoder, getStructEncoder } from '@solana/codecs-data-structures';
import { getShortU16Decoder, getShortU16Encoder } from '@solana/codecs-numbers';

import {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    getTransactionVersionDecoder,
    getTransactionVersionEncoder,
} from '../..';
import { getMessageHeaderDecoder, getMessageHeaderEncoder } from '../legacy/header';
import { getInstructionDecoder, getInstructionEncoder } from '../legacy/instruction';
import { getLifetimeTokenDecoder, getLifetimeTokenEncoder } from '../legacy/lifetime-token';
import { getAddressTableLookupDecoder, getAddressTableLookupEncoder } from './address-table-lookup';

type V0CompiledTransactionMessage = CompiledTransactionMessage & { version: 0 };

export function getMessageEncoder(): VariableSizeEncoder<
    V0CompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage)
> {
    return transformEncoder(
        getStructEncoder([
            ['version', getTransactionVersionEncoder()],
            ['header', getMessageHeaderEncoder()],
            ['staticAccounts', getArrayEncoder(getAddressEncoder(), { size: getShortU16Encoder() })],
            ['lifetimeToken', getLifetimeTokenEncoder()],
            ['instructions', getArrayEncoder(getInstructionEncoder(), { size: getShortU16Encoder() })],
            ['addressTableLookups', getArrayEncoder(getAddressTableLookupEncoder(), { size: getShortU16Encoder() })],
        ]),
        value => ({
            ...value,
            addressTableLookups: value.addressTableLookups ?? [],
            lifetimeToken: 'lifetimeToken' in value ? value.lifetimeToken : undefined,
        }),
    );
}

export function getMessageDecoder(): VariableSizeDecoder<
    CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage
> {
    return transformDecoder(
        getStructDecoder([
            ['version', getTransactionVersionDecoder()],
            ['header', getMessageHeaderDecoder()],
            ['staticAccounts', getArrayDecoder(getAddressDecoder(), { size: getShortU16Decoder() })],
            ['lifetimeToken', getLifetimeTokenDecoder()],
            ['instructions', getArrayDecoder(getInstructionDecoder(), { size: getShortU16Decoder() })],
            ['addressTableLookups', getArrayDecoder(getAddressTableLookupDecoder(), { size: getShortU16Decoder() })],
        ]),
        ({ addressTableLookups, ...restOfMessage }) => {
            if (!addressTableLookups?.length) {
                return { ...restOfMessage, version: 0 };
            }
            return { ...restOfMessage, addressTableLookups, version: 0 };
        },
    );
}

export function getMessageCodec(): VariableSizeCodec<
    V0CompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage),
    CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage
> {
    return combineCodec(getMessageEncoder(), getMessageDecoder());
}
