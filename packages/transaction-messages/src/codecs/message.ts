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
import {
    getArrayDecoder,
    getArrayEncoder,
    getConstantEncoder,
    getStructDecoder,
    getStructEncoder,
    getUnionEncoder,
} from '@solana/codecs-data-structures';
import { getShortU16Decoder, getShortU16Encoder } from '@solana/codecs-numbers';
import { getBase58Decoder, getBase58Encoder } from '@solana/codecs-strings';

import { getCompiledAddressTableLookups } from '../compile/address-table-lookups';
import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../compile/message';
import { getAddressTableLookupDecoder, getAddressTableLookupEncoder } from './address-table-lookup';
import { getMessageHeaderDecoder, getMessageHeaderEncoder } from './header';
import { getInstructionDecoder, getInstructionEncoder } from './instruction';
import { getTransactionVersionDecoder, getTransactionVersionEncoder } from './transaction-version';

function getCompiledMessageLegacyEncoder(): VariableSizeEncoder<
    CompiledTransactionMessage | (CompiledTransactionMessage & CompiledTransactionMessageWithLifetime)
> {
    return getStructEncoder(getPreludeStructEncoderTuple()) as VariableSizeEncoder<
        CompiledTransactionMessage | (CompiledTransactionMessage & CompiledTransactionMessageWithLifetime)
    >;
}

function getCompiledMessageVersionedEncoder(): VariableSizeEncoder<
    CompiledTransactionMessage | (CompiledTransactionMessage & CompiledTransactionMessageWithLifetime)
> {
    return transformEncoder(
        getStructEncoder([
            ...getPreludeStructEncoderTuple(),
            ['addressTableLookups', getAddressTableLookupArrayEncoder()],
        ]) as VariableSizeEncoder<
            CompiledTransactionMessage | (CompiledTransactionMessage & CompiledTransactionMessageWithLifetime)
        >,
        value => {
            if (value.version === 'legacy') {
                return value;
            }
            return {
                ...value,
                addressTableLookups: value.addressTableLookups ?? [],
            };
        },
    );
}

function getPreludeStructEncoderTuple() {
    const lifetimeTokenEncoder = getUnionEncoder(
        [
            // Use a 32-byte constant encoder for a missing lifetime token (index 0).
            getConstantEncoder(new Uint8Array(32)),
            // Use a 32-byte base58 encoder for a valid lifetime token (index 1).
            fixEncoderSize(getBase58Encoder(), 32),
        ],
        value => (value === undefined ? 0 : 1),
    );

    return [
        ['version', getTransactionVersionEncoder()],
        ['header', getMessageHeaderEncoder()],
        ['staticAccounts', getArrayEncoder(getAddressEncoder(), { size: getShortU16Encoder() })],
        ['lifetimeToken', lifetimeTokenEncoder],
        ['instructions', getArrayEncoder(getInstructionEncoder(), { size: getShortU16Encoder() })],
    ] as const;
}

function getPreludeStructDecoderTuple() {
    return [
        ['version', getTransactionVersionDecoder() as Decoder<number>],
        ['header', getMessageHeaderDecoder()],
        ['staticAccounts', getArrayDecoder(getAddressDecoder(), { size: getShortU16Decoder() })],
        ['lifetimeToken', fixDecoderSize(getBase58Decoder(), 32)],
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
export function getCompiledTransactionMessageEncoder(): VariableSizeEncoder<
    CompiledTransactionMessage | (CompiledTransactionMessage & CompiledTransactionMessageWithLifetime)
> {
    return createEncoder({
        getSizeFromValue: compiledMessage => {
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
export function getCompiledTransactionMessageDecoder(): VariableSizeDecoder<
    CompiledTransactionMessage & CompiledTransactionMessageWithLifetime
> {
    return transformDecoder(
        getStructDecoder(getPreludeStructDecoderTuple()) as VariableSizeDecoder<
            CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & {
                    addressTableLookups?: ReturnType<typeof getCompiledAddressTableLookups>;
                }
        >,
        ({ addressTableLookups, ...restOfMessage }) => {
            if (restOfMessage.version === 'legacy' || !addressTableLookups?.length) {
                return restOfMessage;
            }
            return { ...restOfMessage, addressTableLookups };
        },
    );
}

/**
 * Returns a codec that you can use to encode from or decode to {@link CompiledTransactionMessage}
 *
 * @see {@link getCompiledTransactionMessageDecoder}
 * @see {@link getCompiledTransactionMessageEncoder}
 */
export function getCompiledTransactionMessageCodec(): VariableSizeCodec<
    CompiledTransactionMessage | (CompiledTransactionMessage & CompiledTransactionMessageWithLifetime),
    CompiledTransactionMessage & CompiledTransactionMessageWithLifetime
> {
    return combineCodec(getCompiledTransactionMessageEncoder(), getCompiledTransactionMessageDecoder());
}
