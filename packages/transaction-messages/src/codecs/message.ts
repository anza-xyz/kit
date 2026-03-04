import {
    combineCodec,
    createDecoder,
    createEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getPatternMatchDecoder, getPatternMatchEncoder } from '@solana/codecs-data-structures';
import {
    isSolanaError,
    SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE,
    SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED,
    SolanaError,
} from '@solana/errors';

import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../compile/message';
import {
    getMessageDecoder as getLegacyMessageDecoder,
    getMessageEncoder as getLegacyMessageEncoder,
} from './legacy/message';
import { getTransactionVersionDecoder } from './transaction-version';
import { getMessageDecoder as getV0MessageDecoder, getMessageEncoder as getV0MessageEncoder } from './v0/message';
import { getMessageDecoder as getV1MessageDecoder, getMessageEncoder as getV1MessageEncoder } from './v1/message';

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
    // check version is valid
    const encoder = getPatternMatchEncoder<
        CompiledTransactionMessage | (CompiledTransactionMessage & CompiledTransactionMessageWithLifetime)
    >([
        [m => m.version === 'legacy', getLegacyMessageEncoder()],
        [m => m.version === 0, getV0MessageEncoder()],
        [m => m.version === 1, getV1MessageEncoder()],
    ]);

    return createEncoder({
        getSizeFromValue(value) {
            try {
                return encoder.getSizeFromValue(value);
            } catch (error) {
                if (isSolanaError(error, SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE)) {
                    throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
                        unsupportedVersion: value.version,
                    });
                }
                throw error;
            }
        },
        write(value, bytes, offset) {
            try {
                return encoder.write(value, bytes, offset);
            } catch (error) {
                if (isSolanaError(error, SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE)) {
                    throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
                        unsupportedVersion: value.version,
                    });
                }
                throw error;
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
    return createDecoder({
        read(bytes, offset) {
            const [version] = getTransactionVersionDecoder().read(bytes, offset);

            return getPatternMatchDecoder([
                [
                    () => version === 'legacy',
                    getLegacyMessageDecoder() as VariableSizeDecoder<
                        CompiledTransactionMessage & CompiledTransactionMessageWithLifetime
                    >,
                ],
                [
                    () => version === 0,
                    getV0MessageDecoder() as VariableSizeDecoder<
                        CompiledTransactionMessage & CompiledTransactionMessageWithLifetime
                    >,
                ],
                [
                    () => version === 1,
                    getV1MessageDecoder() as VariableSizeDecoder<
                        CompiledTransactionMessage & CompiledTransactionMessageWithLifetime
                    >,
                ],
            ]).read(bytes, offset);
        },
    });
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
