import { Address, getAddressDecoder } from '@solana/addresses';
import {
    combineCodec,
    createDecoder,
    createEncoder,
    fixDecoderSize,
    padRightDecoder,
    ReadonlyUint8Array,
    transformDecoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import {
    getArrayDecoder,
    getBytesDecoder,
    getBytesEncoder,
    getPredicateDecoder,
    getPredicateEncoder,
    getStructDecoder,
    getStructEncoder,
    getTupleDecoder,
} from '@solana/codecs-data-structures';
import { getShortU16Decoder, getU8Decoder } from '@solana/codecs-numbers';
import {
    SOLANA_ERROR__TRANSACTION__CANNOT_DECODE_EMPTY_TRANSACTION_BYTES,
    SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_MESSAGE_BYTES,
    SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES,
    SOLANA_ERROR__TRANSACTION__MESSAGE_SIGNATURES_MISMATCH,
    SOLANA_ERROR__TRANSACTION__SIGNATURE_COUNT_TOO_HIGH_FOR_TRANSACTION_BYTES,
    SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED,
    SOLANA_ERROR__TRANSACTION__VERSION_ZERO_MUST_BE_ENCODED_WITH_SIGNATURES_FIRST,
    SolanaError,
} from '@solana/errors';
import { SignatureBytes } from '@solana/keys';
import { getTransactionVersionDecoder } from '@solana/transaction-messages';

import { SignaturesMap, Transaction, TransactionMessageBytes } from '../transaction';
import { getSignaturesEncoderWithLength, getSignaturesEncoderWithSizePrefix } from './signatures-encoder';

type EnvelopeShape = 'messageFirst' | 'signaturesFirst';

const SIGNATURE_COUNT_FLAG_MASK = 0b10000000;
const VERSION_FLAG_MASK = 0b01111111;

function getEnvelopeShapeFromMessageBytes(messageBytes: ReadonlyUint8Array): EnvelopeShape {
    if (messageBytes.length === 0) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_MESSAGE_BYTES);
    }

    const version = getTransactionVersionDecoder().decode(messageBytes);
    return version === 1 ? 'messageFirst' : 'signaturesFirst';
}

function getEnvelopeShapeFromTransactionBytes(transactionBytes: ReadonlyUint8Array): EnvelopeShape {
    if (transactionBytes.length === 0) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__CANNOT_DECODE_EMPTY_TRANSACTION_BYTES);
    }
    const firstByte = transactionBytes[0];
    if ((firstByte & SIGNATURE_COUNT_FLAG_MASK) === 0) {
        // First byte is a signature count, so signatures come first
        return 'signaturesFirst';
    }
    // If the first byte is not a signature count, then we must have message bytes first,
    // and the first byte of the message must be the version byte
    const version = firstByte & VERSION_FLAG_MASK;
    if (version === 0) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_ZERO_MUST_BE_ENCODED_WITH_SIGNATURES_FIRST, {
            firstByte,
            transactionBytes,
        });
    }
    if (version === 1) {
        return 'messageFirst';
    }
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
        unsupportedVersion: version,
    });
}

/**
 * Returns an encoder that you can use to encode a {@link Transaction} to a byte array in a wire
 * format appropriate for sending to the Solana network for execution.
 */
export function getTransactionEncoder(): VariableSizeEncoder<Transaction> {
    return getPredicateEncoder(
        (transaction: Transaction) => getEnvelopeShapeFromMessageBytes(transaction.messageBytes) === 'signaturesFirst',
        getTransactionEncoderWithSignaturesFirst(),
        getTransactionEncoderWithMessageFirst(),
    );
}

function getTransactionEncoderWithSignaturesFirst(): VariableSizeEncoder<Transaction> {
    return getStructEncoder([
        ['signatures', getSignaturesEncoderWithSizePrefix()],
        ['messageBytes', getBytesEncoder()],
    ]);
}

function getSignatureCountForVersionedOrThrow(messageBytes: ReadonlyUint8Array, offset: number): number {
    if (messageBytes.length < offset + 2) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES, {
            messageBytes,
        });
    }
    return messageBytes[offset + 1]; // second byte
}

function getTransactionEncoderWithMessageFirst(): VariableSizeEncoder<Transaction> {
    const bytesEncoder = getBytesEncoder();

    return createEncoder({
        getSizeFromValue: (transaction: Transaction) => {
            const signatureCount = getSignatureCountForVersionedOrThrow(transaction.messageBytes, 0);
            return transaction.messageBytes.length + signatureCount * 64;
        },
        write: (transaction: Transaction, bytes: Uint8Array, offset: number) => {
            // 1. Encode messageBytes first
            offset = bytesEncoder.write(transaction.messageBytes, bytes, offset);

            // 2. Extract signature count from second byte
            const signatureCount = getSignatureCountForVersionedOrThrow(transaction.messageBytes, 0);

            // 3. Encode signatures with the extracted length
            const signaturesEncoder = getSignaturesEncoderWithLength(signatureCount);
            offset = signaturesEncoder.write(transaction.signatures, bytes, offset);

            return offset;
        },
    });
}

/**
 * Returns a decoder that you can use to convert a byte array in the Solana transaction wire format
 * to a {@link Transaction} object.
 *
 * @example
 * ```ts
 * import { getTransactionDecoder } from '@solana/transactions';
 *
 * const transactionDecoder = getTransactionDecoder();
 * const transaction = transactionDecoder.decode(wireTransactionBytes);
 * for (const [address, signature] in Object.entries(transaction.signatures)) {
 *     console.log(`Signature by ${address}`, signature);
 * }
 * ```
 */

export function getTransactionDecoder(): VariableSizeDecoder<Transaction> {
    return getPredicateDecoder(
        (transactionBytes: ReadonlyUint8Array) =>
            getEnvelopeShapeFromTransactionBytes(transactionBytes) === 'signaturesFirst',
        getTransactionDecoderWithSignaturesFirst(),
        getTransactionDecoderWithMessageFirst(),
    );
}

function getTransactionDecoderWithSignaturesFirst(): VariableSizeDecoder<Transaction> {
    return transformDecoder(
        getStructDecoder([
            ['signatures', getArrayDecoder(fixDecoderSize(getBytesDecoder(), 64), { size: getShortU16Decoder() })],
            ['messageBytes', getBytesDecoder()],
        ]),
        decodePartiallyDecodedLegacyOrV0Transaction,
    );
}

function getTransactionDecoderWithMessageFirst(): VariableSizeDecoder<Transaction> {
    return transformDecoder(
        getPartiallyDecodedTransactionDecoderWithMessageFirst(),
        decodePartiallyDecodedV1Transaction,
    );
}

function getPartiallyDecodedTransactionDecoderWithMessageFirst(): VariableSizeDecoder<PartiallyDecodedTransaction> {
    return createDecoder({
        read(bytes, offset) {
            // 1. Message comes first, so read signature count from message bytes
            const signatureCount = getSignatureCountForVersionedOrThrow(bytes, offset);
            const signatureByteLength = signatureCount * 64;

            // 2. Read the message, which is all bytes except the last {signatureByteLength} bytes
            // Note that this is based on an assumption that we want to read the rest of the input bytes
            // as a transaction, which allows us to avoid decoding the entire message bytes to read each field
            // This is the same logic as using `getBytesDecoder` to read the message bytes when they are trailing
            const messageBytesLength = bytes.length - offset - signatureByteLength;
            if (messageBytesLength < 0) {
                throw new SolanaError(SOLANA_ERROR__TRANSACTION__SIGNATURE_COUNT_TOO_HIGH_FOR_TRANSACTION_BYTES, {
                    numExpectedSignatures: signatureCount,
                    transactionBytes: bytes.subarray(offset),
                    transactionBytesLength: bytes.length - offset,
                });
            }
            const messageBytes = bytes.subarray(offset, offset + messageBytesLength);

            // 3. Read the signature bytes, which are the remaining bytes
            const [signatures, finalOffset] = getArrayDecoder(fixDecoderSize(getBytesDecoder(), 64), {
                size: signatureCount,
            }).read(bytes, offset + messageBytesLength);

            return [
                {
                    messageBytes: messageBytes as unknown as TransactionMessageBytes,
                    signatures,
                },
                finalOffset,
            ];
        },
    });
}

/**
 * Returns a codec that you can use to encode from or decode to a {@link Transaction}
 *
 * @see {@link getTransactionDecoder}
 * @see {@link getTransactionEncoder}
 */
export function getTransactionCodec(): VariableSizeCodec<Transaction> {
    return combineCodec(getTransactionEncoder(), getTransactionDecoder());
}

type PartiallyDecodedTransaction = {
    messageBytes: ReadonlyUint8Array;
    signatures: ReadonlyUint8Array[];
};

function decodePartiallyDecodedLegacyOrV0Transaction(transaction: PartiallyDecodedTransaction): Transaction {
    const { messageBytes, signatures } = transaction;

    /*
    Relevant message structure is at the start:
    - transaction version (0 bytes for legacy transactions, 1 byte for versioned transactions)
    - `numRequiredSignatures` (1 byte, we verify this matches the length of signatures)
    - `numReadOnlySignedAccounts` (1 byte, not used here)
    - `numReadOnlyUnsignedAccounts` (1 byte, not used here)
    - static addresses, with signers first. This is an array of addresses, prefixed with a short-u16 length
    */

    const signerAddressesDecoder = getTupleDecoder([
        // read transaction version
        getTransactionVersionDecoder(),
        // read first byte of header, `numSignerAccounts`
        // padRight to skip the next 2 bytes, `numReadOnlySignedAccounts` and `numReadOnlyUnsignedAccounts` which we don't need
        padRightDecoder(getU8Decoder(), 2),
        // read static addresses
        getArrayDecoder(getAddressDecoder(), { size: getShortU16Decoder() }),
    ]);
    const [_txVersion, numRequiredSignatures, staticAddresses] = signerAddressesDecoder.decode(messageBytes);

    const signerAddresses = staticAddresses.slice(0, numRequiredSignatures);

    // signer addresses and signatures must be the same length
    // we encode an all-zero signature when the signature is missing
    if (signerAddresses.length !== signatures.length) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__MESSAGE_SIGNATURES_MISMATCH, {
            numRequiredSignatures,
            signaturesLength: signatures.length,
            signerAddresses,
        });
    }

    // combine the signer addresses + signatures into the signatures map
    const signaturesMap = makeSignaturesMap(signerAddresses, signatures);

    return {
        messageBytes: messageBytes as TransactionMessageBytes,
        signatures: Object.freeze(signaturesMap),
    };
}

function decodePartiallyDecodedV1Transaction(transaction: PartiallyDecodedTransaction): Transaction {
    const { messageBytes, signatures } = transaction;

    /*
    Relevant message structure is at the start:
    - transaction version (1 byte for versioned transactions)
    - `numRequiredSignatures` (1 byte, we verify this matches the length of signatures)
    - `numReadOnlySignedAccounts` (1 byte, not used here)
    - `numReadOnlyUnsignedAccounts` (1 byte, not used here)
    - transaction config mask (4 bytes, not used here)
    - lifetime specifier (4 bytes, not used here)
    - num instructions (1 byte, not used here)
    - num addresses (1 byte, not used here because we only need to read `numRequiredSignatures` addresses)
    - static addresses, with signers first. This is an array of addresses, with no prefix
    */

    const numRequiredSignatures = messageBytes[1]; // second byte

    /**
     * Static addresses start after:
     * - 1 byte transaction version
     * - 3 bytes for the header (`numRequiredSignatures`, `numReadOnlySignedAccounts`, and `numReadOnlyUnsignedAccounts`)
     * - 4 bytes for transaction config mask
     * - 4 bytes for lifetime specifier
     * - 1 byte for num instructions
     * - 1 byte for num addresses
     */
    const staticAddressOffset = 1 + 3 + 4 + 4 + 1 + 1;

    const signerAddresses = getArrayDecoder(getAddressDecoder(), { size: numRequiredSignatures }).decode(
        messageBytes,
        staticAddressOffset,
    );

    if (signerAddresses.length !== signatures.length) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__MESSAGE_SIGNATURES_MISMATCH, {
            numRequiredSignatures,
            signaturesLength: signatures.length,
            signerAddresses,
        });
    }

    const signaturesMap = makeSignaturesMap(signerAddresses, signatures);

    return {
        messageBytes: messageBytes as TransactionMessageBytes,
        signatures: signaturesMap,
    };
}

function makeSignaturesMap(signerAddresses: Address[], signatures: ReadonlyUint8Array[]): SignaturesMap {
    // combine the signer addresses + signatures into the signatures map
    const signaturesMap: SignaturesMap = {};
    signerAddresses.forEach((address, index) => {
        const signatureForAddress = signatures[index];
        if (signatureForAddress.every(b => b === 0)) {
            signaturesMap[address] = null;
        } else {
            signaturesMap[address] = signatureForAddress as SignatureBytes;
        }
    });

    return Object.freeze(signaturesMap);
}
