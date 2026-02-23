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

import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../..';
import { getMessageHeaderDecoder, getMessageHeaderEncoder } from './header';
import { getInstructionDecoder, getInstructionEncoder } from './instruction';
import { getLifetimeTokenDecoder, getLifetimeTokenEncoder } from './lifetime-token';

type LegacyCompiledTransactionMessage = CompiledTransactionMessage & { version: 'legacy' };

export function getMessageEncoder(): VariableSizeEncoder<
    LegacyCompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage)
> {
    return transformEncoder(
        getStructEncoder([
            ['header', getMessageHeaderEncoder()],
            ['staticAccounts', getArrayEncoder(getAddressEncoder(), { size: getShortU16Encoder() })],
            ['lifetimeToken', getLifetimeTokenEncoder()],
            ['instructions', getArrayEncoder(getInstructionEncoder(), { size: getShortU16Encoder() })],
        ]),
        value => ({
            ...value,
            lifetimeToken: 'lifetimeToken' in value ? value.lifetimeToken : undefined,
        }),
    );
}
export function getMessageDecoder(): VariableSizeDecoder<
    CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage
> {
    return transformDecoder(
        getStructDecoder([
            ['header', getMessageHeaderDecoder()],
            ['staticAccounts', getArrayDecoder(getAddressDecoder(), { size: getShortU16Decoder() })],
            ['lifetimeToken', getLifetimeTokenDecoder()],
            ['instructions', getArrayDecoder(getInstructionDecoder(), { size: getShortU16Decoder() })],
        ]),
        value => ({
            ...value,
            version: 'legacy',
        }),
    );
}

export function getMessageCodec(): VariableSizeCodec<
    LegacyCompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage),
    CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage
> {
    return combineCodec(getMessageEncoder(), getMessageDecoder());
}
