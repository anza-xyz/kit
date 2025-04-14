import { getAddressDecoder } from '@solana/addresses';
import {
    combineCodec,
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
    getStructDecoder,
    getStructEncoder,
    getTupleDecoder,
} from '@solana/codecs-data-structures';
import { getShortU16Decoder, getU8Decoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__TRANSACTION__MESSAGE_SIGNATURES_MISMATCH, SolanaError } from '@solana/errors';
import { SignatureBytes } from '@solana/keys';
import { getTransactionVersionDecoder } from '@solana/transaction-messages';

import { SignaturesMap, Transaction, TransactionMessageBytes } from '../transaction';
import { getSignaturesEncoder } from './signatures-encoder';

/**
 * Returns an encoder that you can use to encode a {@link Transaction} to a byte array in a wire
 * format appropriate for sending to the Solana network for execution.
 */
export function getTransactionEncoder(): VariableSizeEncoder<Transaction> {
    return getStructEncoder([
        ['signatures', getSignaturesEncoder()],
        ['messageBytes', getBytesEncoder()],
    ]);
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
