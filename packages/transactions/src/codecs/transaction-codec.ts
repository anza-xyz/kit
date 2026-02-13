import { getAddressDecoder } from '@solana/addresses';
import {
    combineCodec,
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
    getPredicateEncoder,
    getStructDecoder,
    getStructEncoder,
    getTupleDecoder,
} from '@solana/codecs-data-structures';
import { getShortU16Decoder, getU8Decoder } from '@solana/codecs-numbers';
import {
    SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES,
    SOLANA_ERROR__TRANSACTION__MESSAGE_SIGNATURES_MISMATCH,
    SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED,
    SolanaError,
} from '@solana/errors';
import { SignatureBytes } from '@solana/keys';
import { getTransactionVersionDecoder } from '@solana/transaction-messages';

import { SignaturesMap, Transaction, TransactionMessageBytes } from '../transaction';
import { getSignaturesEncoderWithLength, getSignaturesEncoderWithSizePrefix } from './signatures-encoder';

type EnvelopeShape = 'messageFirst' | 'signaturesFirst';

const LEGACY_VERSION_FLAG_MASK = 0b10000000;
const VERSION_FLAG_MASK = 0b01111111;

function getEncodeShapeForMessageBytes(messageBytes: ReadonlyUint8Array): EnvelopeShape {
    const firstByte = messageBytes[0];
    if ((firstByte & LEGACY_VERSION_FLAG_MASK) === 0) {
        // Legacy transaction: encode with signatures first
        return 'signaturesFirst';
    }
    const version = firstByte & VERSION_FLAG_MASK;
    if (version === 0) {
        // v0 transaction: encode with signatures first
        return 'signaturesFirst';
    }
    if (version === 1) {
        // v1 transaction: encode with message first
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
        (transaction: Transaction) => getEncodeShapeForMessageBytes(transaction.messageBytes) === 'signaturesFirst',
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

function getSignatureCountForVersionedOrThrow(messageBytes: ReadonlyUint8Array): number {
    if (messageBytes.length < 2) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES, {
            messageBytes,
        });
    }
    return messageBytes[1]; // second byte
}

function getTransactionEncoderWithMessageFirst(): VariableSizeEncoder<Transaction> {
    const bytesEncoder = getBytesEncoder();

    return createEncoder({
        getSizeFromValue: (transaction: Transaction) => {
            const signatureCount = getSignatureCountForVersionedOrThrow(transaction.messageBytes);
            return transaction.messageBytes.length + signatureCount * 64;
        },
        write: (transaction: Transaction, bytes: Uint8Array, offset: number) => {
            // 1. Encode messageBytes first
            offset = bytesEncoder.write(transaction.messageBytes, bytes, offset);

            // 2. Extract signature count from second byte
            const signatureCount = getSignatureCountForVersionedOrThrow(transaction.messageBytes);

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
    return transformDecoder(
        getStructDecoder([
            ['signatures', getArrayDecoder(fixDecoderSize(getBytesDecoder(), 64), { size: getShortU16Decoder() })],
            ['messageBytes', getBytesDecoder()],
        ]),
        decodePartiallyDecodedTransaction,
    );
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

function decodePartiallyDecodedTransaction(transaction: PartiallyDecodedTransaction): Transaction {
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
    const signaturesMap: SignaturesMap = {};
    signerAddresses.forEach((address, index) => {
        const signatureForAddress = signatures[index];
        if (signatureForAddress.every(b => b === 0)) {
            signaturesMap[address] = null;
        } else {
            signaturesMap[address] = signatureForAddress as SignatureBytes;
        }
    });

    return {
        messageBytes: messageBytes as TransactionMessageBytes,
        signatures: Object.freeze(signaturesMap),
    };
}
