import {
    combineCodec,
    createDecoder,
    createEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_OUT_OF_RANGE, SolanaError } from '@solana/errors';

import { TransactionVersion } from '../transaction-message';

const VERSION_FLAG_MASK = 0x80;

/**
 * Returns an encoder that you can use to encode a {@link TransactionVersion} to a byte array.
 *
 * Legacy messages will produce an empty array and will not advance the offset. Versioned messages
 * will produce an array with a single byte.
 */
export function getTransactionVersionEncoder(): VariableSizeEncoder<TransactionVersion> {
    return createEncoder({
        getSizeFromValue: value => (value === 'legacy' ? 0 : 1),
        maxSize: 1,
        write: (value, bytes, offset) => {
            if (value === 'legacy') {
                return offset;
            }
            if (value < 0 || value > 127) {
                throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_OUT_OF_RANGE, {
                    actualVersion: value,
                });
            }
            bytes.set([value | VERSION_FLAG_MASK], offset);
            return offset + 1;
        },
    });
}

/**
 * Returns a decoder that you can use to decode a byte array representing a
 * {@link TransactionVersion}.
 *
 * When the byte at the current offset is determined to represent a legacy transaction, this decoder
 * will return `'legacy'` and will not advance the offset.
 */
export function getTransactionVersionDecoder(): VariableSizeDecoder<TransactionVersion> {
    return createDecoder({
        maxSize: 1,
        read: (bytes, offset) => {
            const firstByte = bytes[offset];
            if ((firstByte & VERSION_FLAG_MASK) === 0) {
                // No version flag set; it's a legacy (unversioned) transaction.
                return ['legacy', offset];
            } else {
                const version = (firstByte ^ VERSION_FLAG_MASK) as TransactionVersion;
                return [version, offset + 1];
            }
        },
    });
}

/**
 * Returns a codec that you can use to encode from or decode to {@link TransactionVersion}
 *
 * @see {@link getTransactionVersionDecoder}
 * @see {@link getTransactionVersionEncoder}
 */
export function getTransactionVersionCodec(): VariableSizeCodec<TransactionVersion> {
    return combineCodec(getTransactionVersionEncoder(), getTransactionVersionDecoder());
}
