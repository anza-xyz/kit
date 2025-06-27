import { getAddressDecoder, getAddressEncoder } from '@solana/addresses';
import {
    combineCodec,
    createEncoder,
    Decoder,
    fixDecoderSize,
    fixEncoderSize,
    transformDecoder,
    transformEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getArrayDecoder, getArrayEncoder, getStructDecoder, getStructEncoder } from '@solana/codecs-data-structures';
import { getShortU16Decoder, getShortU16Encoder } from '@solana/codecs-numbers';
import { getBase58Decoder, getBase58Encoder } from '@solana/codecs-strings';

import { getCompiledAddressTableLookups } from '../compile/address-table-lookups';
import { CompiledTransactionMessage } from '../compile/message';
import { getAddressTableLookupDecoder, getAddressTableLookupEncoder } from './address-table-lookup';
import { getMessageHeaderDecoder, getMessageHeaderEncoder } from './header';
import { getInstructionDecoder, getInstructionEncoder } from './instruction';
import { getTransactionVersionDecoder, getTransactionVersionEncoder } from './transaction-version';

function getCompiledMessageLegacyEncoder(): VariableSizeEncoder<CompiledTransactionMessage> {
    return getStructEncoder(getPreludeStructEncoderTuple()) as VariableSizeEncoder<CompiledTransactionMessage>;
}

function getCompiledMessageVersionedEncoder(): VariableSizeEncoder<CompiledTransactionMessage> {
    return transformEncoder(
        getStructEncoder([
            ...getPreludeStructEncoderTuple(),
            ['addressTableLookups', getAddressTableLookupArrayEncoder()],
        ]) as VariableSizeEncoder<CompiledTransactionMessage>,
        (value: CompiledTransactionMessage) => {
            if (value.version === 'legacy') {
                return value;
            }
            return {
                ...value,
                addressTableLookups: value.addressTableLookups ?? [],
            } as Exclude<CompiledTransactionMessage, { readonly version: 'legacy' }>;
        },
    );
}

function getPreludeStructEncoderTuple() {
    return [
        ['version', getTransactionVersionEncoder()],
        ['header', getMessageHeaderEncoder()],
        ['staticAccounts', getArrayEncoder(getAddressEncoder(), { size: getShortU16Encoder() })],
        [
            'lifetimeToken',
            transformEncoder(
                fixEncoderSize(getBase58Encoder(), 32),
                (lifetimeToken: string | undefined): string => lifetimeToken ?? '11111111111111111111111111111111',
            ),
        ],
        ['instructions', getArrayEncoder(getInstructionEncoder(), { size: getShortU16Encoder() })],
    ] as const;
}

function getPreludeStructDecoderTuple() {
    return [
        ['version', getTransactionVersionDecoder() as Decoder<number>],
        ['header', getMessageHeaderDecoder()],
        ['staticAccounts', getArrayDecoder(getAddressDecoder(), { size: getShortU16Decoder() })],
        [
            'lifetimeToken',
            transformDecoder(fixDecoderSize(getBase58Decoder(), 32), (lifetimeToken: string): string | undefined =>
                lifetimeToken === '11111111111111111111111111111111' ? undefined : lifetimeToken,
            ),
        ],
        ['instructions', getArrayDecoder(getInstructionDecoder(), { size: getShortU16Decoder() })],
        ['addressTableLookups', getAddressTableLookupArrayDecoder()],
    ] as const;
}

function getAddressTableLookupArrayEncoder() {
    return getArrayEncoder(getAddressTableLookupEncoder(), { size: getShortU16Encoder() });
}

function getAddressTableLookupArrayDecoder() {
    return getArrayDecoder(getAddressTableLookupDecoder(), { size: getShortU16Decoder() });
}

/**
 * Returns an encoder that you can use to encode a {@link CompiledTransactionMessage} to a byte
 * array.
 *
 * The wire format of a Solana transaction consists of signatures followed by a compiled transaction
 * message. The byte array produced by this encoder is the message part.
 */
export function getCompiledTransactionMessageEncoder(): VariableSizeEncoder<CompiledTransactionMessage> {
    return createEncoder({
        getSizeFromValue: (compiledMessage: CompiledTransactionMessage) => {
            if (compiledMessage.version === 'legacy') {
                return getCompiledMessageLegacyEncoder().getSizeFromValue(compiledMessage);
            } else {
                return getCompiledMessageVersionedEncoder().getSizeFromValue(compiledMessage);
            }
        },
        write: (compiledMessage, bytes, offset) => {
            if (compiledMessage.version === 'legacy') {
                return getCompiledMessageLegacyEncoder().write(compiledMessage, bytes, offset);
            } else {
                return getCompiledMessageVersionedEncoder().write(compiledMessage, bytes, offset);
            }
        },
    });
}

/**
 * Returns a decoder that you can use to decode a byte array representing a
 * {@link CompiledTransactionMessage}.
 *
 * The wire format of a Solana transaction consists of signatures followed by a compiled transaction
 * message. You can use this decoder to decode the message part.
 */
export function getCompiledTransactionMessageDecoder(): VariableSizeDecoder<CompiledTransactionMessage> {
    return transformDecoder(
        getStructDecoder(getPreludeStructDecoderTuple()) as VariableSizeDecoder<
            CompiledTransactionMessage & { addressTableLookups?: ReturnType<typeof getCompiledAddressTableLookups> }
        >,
        ({ addressTableLookups, ...restOfMessage }) => {
            if (restOfMessage.version === 'legacy' || !addressTableLookups?.length) {
                return restOfMessage;
            }
            return { ...restOfMessage, addressTableLookups } as Exclude<
                CompiledTransactionMessage,
                { readonly version: 'legacy' }
            >;
        },
    );
}

/**
 * Returns a codec that you can use to encode from or decode to {@link CompiledTransactionMessage}
 *
 * @see {@link getCompiledTransactionMessageDecoder}
 * @see {@link getCompiledTransactionMessageEncoder}
 */
export function getCompiledTransactionMessageCodec(): VariableSizeCodec<CompiledTransactionMessage> {
    return combineCodec(getCompiledTransactionMessageEncoder(), getCompiledTransactionMessageDecoder());
}
