import { Address, getAddressFromPublicKey } from '@solana/addresses';
import { Decoder } from '@solana/codecs-core';
import { getBase58Decoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__TRANSACTION__ADDRESSES_CANNOT_SIGN_TRANSACTION,
    SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING,
    SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING,
    SolanaError,
} from '@solana/errors';
import { Signature, SignatureBytes, signBytes } from '@solana/keys';

import { Transaction } from './transaction';

/**
 * Represents a transaction that is signed by all of its required signers. Being fully signed is a
 * prerequisite of functions designed to land transactions on the network.
 */
export interface FullySignedTransaction extends Transaction {
    readonly __brand: unique symbol;
}

let base58Decoder: Decoder<string> | undefined;

/**
 * Given a transaction signed by its fee payer, this method will return the {@link Signature} that
 * uniquely identifies it. This string can be used to look up transactions at a later date, for
 * example on a Solana block explorer.
 *
 * @example
 * ```ts
 * import { getSignatureFromTransaction } from '@solana/transactions';
 *
 * const signature = getSignatureFromTransaction(tx);
 * console.debug(`Inspect this transaction at https://explorer.solana.com/tx/${signature}`);
 * ```
 */
export function getSignatureFromTransaction(transaction: Transaction): Signature {
    if (!base58Decoder) base58Decoder = getBase58Decoder();

    // We have ordered signatures from the compiled message accounts
    // first signature is the fee payer
    const signatureBytes = Object.values(transaction.signatures)[0];
    if (!signatureBytes) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING);
    }
    const transactionSignature = base58Decoder.decode(signatureBytes);
    return transactionSignature as Signature;
}

function uint8ArraysEqual(arr1: Uint8Array, arr2: Uint8Array) {
    return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}

/**
 * Given an array of `CryptoKey` objects which are private keys pertaining to addresses that are
 * required to sign a transaction, this method will return a new signed transaction of type
 * {@link Transaction}.
 *
 * Though the resulting transaction might have every signature it needs to land on the network, this
 * function will not assert that it does. A partially signed transaction cannot be landed on the
 * network, but can be serialized and deserialized.
 *
 * @example
 * ```ts
 * import { generateKeyPair } from '@solana/keys';
 * import { partiallySignTransaction } from '@solana/transactions';
 *
 * const partiallySignedTransaction = await partiallySignTransaction([myPrivateKey], tx);
 * ```
 *
 * @see {@link signTransaction} if you want to assert that the transaction has all of its required
 * signatures after signing.
 */
export async function partiallySignTransaction<T extends Transaction>(
    keyPairs: CryptoKeyPair[],
    transaction: T,
): Promise<T> {
    let newSignatures: Record<Address, SignatureBytes> | undefined;
    let unexpectedSigners: Set<Address> | undefined;

    await Promise.all(
        keyPairs.map(async keyPair => {
            const address = await getAddressFromPublicKey(keyPair.publicKey);
            const existingSignature = transaction.signatures[address];

            // Check if the address is expected to sign the transaction
            if (existingSignature === undefined) {
                // address is not an expected signer for this transaction
                unexpectedSigners ||= new Set();
                unexpectedSigners.add(address);
                return;
            }

            // Return if there are any unexpected signers already since we won't be using signatures
            if (unexpectedSigners) {
                return;
            }

            const newSignature = await signBytes(keyPair.privateKey, transaction.messageBytes);

            if (existingSignature !== null && uint8ArraysEqual(newSignature, existingSignature)) {
                // already have the same signature set
                return;
            }

            newSignatures ||= {};
            newSignatures[address] = newSignature;
        }),
    );

    if (unexpectedSigners && unexpectedSigners.size > 0) {
        const expectedSigners = Object.keys(transaction.signatures);
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__ADDRESSES_CANNOT_SIGN_TRANSACTION, {
            expectedAddresses: expectedSigners,
            unexpectedAddresses: [...unexpectedSigners],
        });
    }

    if (!newSignatures) {
        return transaction;
    }

    return Object.freeze({
        ...transaction,
        signatures: Object.freeze({
            ...transaction.signatures,
            ...newSignatures,
        }),
    });
}

/**
 * Given an array of `CryptoKey` objects which are private keys pertaining to addresses that are
 * required to sign a transaction, this method will return a new signed transaction of type
 * {@link FullySignedTransaction}.
 *
 * This function will throw unless the resulting transaction is fully signed.
 *
 * @example
 * ```ts
 * import { generateKeyPair } from '@solana/keys';
 * import { signTransaction } from '@solana/transactions';
 *
 * const signedTransaction = await signTransaction([myPrivateKey], tx);
 * ```
 *
 * @see {@link partiallySignTransaction} if you want to sign the transaction without asserting that
 * the resulting transaction is fully signed.
 */
export async function signTransaction<T extends Transaction>(
    keyPairs: CryptoKeyPair[],
    transaction: T,
): Promise<FullySignedTransaction & T> {
    const out = await partiallySignTransaction(keyPairs, transaction);
    assertTransactionIsFullySigned(out);
    Object.freeze(out);
    return out;
}

/**
 * From time to time you might acquire a {@link Transaction}, that you expect to be fully signed,
 * from an untrusted network API or user input. Use this function to assert that such a transaction
 * is fully signed.
 *
 * @example
 * ```ts
 * import { assertTransactionIsFullySigned } from '@solana/transactions';
 *
 * const transaction = getTransactionDecoder().decode(transactionBytes);
 * try {
 *     // If this type assertion function doesn't throw, then Typescript will upcast `transaction`
 *     // to `FullySignedTransaction`.
 *     assertTransactionIsFullySigned(transaction);
 *     // At this point we know that the transaction is signed and can be sent to the network.
 *     await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
 * } catch(e) {
 *     if (isSolanaError(e, SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING)) {
 *         setError(`Missing signatures for ${e.context.addresses.join(', ')}`);
 *     }
 *     throw;
 * }
 */
export function assertTransactionIsFullySigned(
    transaction: Transaction,
): asserts transaction is FullySignedTransaction {
    const missingSigs: Address[] = [];
    Object.entries(transaction.signatures).forEach(([address, signatureBytes]) => {
        if (!signatureBytes) {
            missingSigs.push(address as Address);
        }
    });

    if (missingSigs.length > 0) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING, {
            addresses: missingSigs,
        });
    }
}
