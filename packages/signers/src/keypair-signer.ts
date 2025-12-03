import { Address, getAddressFromPublicKey } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import { SOLANA_ERROR__SIGNER__EXPECTED_KEY_PAIR_SIGNER, SolanaError } from '@solana/errors';
import { createKeyPairFromBytes, createKeyPairFromPrivateKeyBytes, generateKeyPair, signBytes } from '@solana/keys';
import { partiallySignTransaction } from '@solana/transactions';

import { isMessagePartialSigner, MessagePartialSigner } from './message-partial-signer';
import { isTransactionPartialSigner, TransactionPartialSigner } from './transaction-partial-signer';

/**
 * Defines a signer that uses a {@link CryptoKeyPair} to sign messages and transactions.
 *
 * It implements both the {@link MessagePartialSigner} and {@link TransactionPartialSigner}
 * interfaces and keeps track of the {@link CryptoKeyPair} instance used
 * to sign messages and transactions.
 *
 * @typeParam TAddress - Supply a string literal to define a signer having a particular address.
 *
 * @example
 * ```ts
 * import { generateKeyPairSigner } from '@solana/signers';
 *
 * const signer = generateKeyPairSigner();
 * signer.address; // Address;
 * signer.keyPair; // CryptoKeyPair;
 * const [messageSignatures] = await signer.signMessages([message]);
 * const [transactionSignatures] = await signer.signTransactions([transaction]);
 * ```
 *
 * @see {@link generateKeyPairSigner}
 * @see {@link createSignerFromKeyPair}
 * @see {@link createKeyPairSignerFromBytes}
 * @see {@link createKeyPairSignerFromPrivateKeyBytes}
 * @see {@link isKeyPairSigner}
 * @see {@link assertIsKeyPairSigner}
 */
export type KeyPairSigner<TAddress extends string = string> = MessagePartialSigner<TAddress> &
    TransactionPartialSigner<TAddress> & { keyPair: CryptoKeyPair };

/**
 * Checks whether the provided value implements the {@link KeyPairSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { generateKeyPairSigner, isKeyPairSigner } from '@solana/signers';
 *
 * const signer = await generateKeyPairSigner();
 * isKeyPairSigner(signer); // true
 * isKeyPairSigner({ address: address('1234..5678') }); // false
 * ```
 */
export function isKeyPairSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): value is KeyPairSigner<TAddress> {
    return (
        'keyPair' in value &&
        typeof value.keyPair === 'object' &&
        isMessagePartialSigner(value) &&
        isTransactionPartialSigner(value)
    );
}

/**
 * Asserts that the provided value implements the {@link KeyPairSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { generateKeyPairSigner, assertIsKeyPairSigner } from '@solana/signers';
 *
 * const signer = await generateKeyPairSigner();
 * assertIsKeyPairSigner(signer); // void
 * assertIsKeyPairSigner({ address: address('1234..5678') }); // Throws an error.
 * ```
 */
export function assertIsKeyPairSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): asserts value is KeyPairSigner<TAddress> {
    if (!isKeyPairSigner(value)) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__EXPECTED_KEY_PAIR_SIGNER, {
            address: value.address,
        });
    }
}

/**
 * Creates a {@link KeyPairSigner} from a provided {@link CryptoKeyPair}.
 *
 * The {@link MessagePartialSigner#signMessages | signMessages} and
 * {@link TransactionPartialSigner#signTransactions | signTransactions}
 * functions of the returned signer will use the private key of the provided
 * key pair to sign messages and transactions.
 *
 * Note that both the {@link MessagePartialSigner#signMessages | signMessages} and
 * {@link TransactionPartialSigner#signTransactions | signTransactions} implementations
 * are parallelized, meaning that they will sign all provided messages and transactions in parallel.
 *
 * @example
 * ```ts
 * import { generateKeyPair } from '@solana/keys';
 * import { createSignerFromKeyPair, KeyPairSigner } from '@solana/signers';
 *
 * const keyPair: CryptoKeyPair = await generateKeyPair();
 * const signer: KeyPairSigner = await createSignerFromKeyPair(keyPair);
 * ```
 */
export async function createSignerFromKeyPair(keyPair: CryptoKeyPair): Promise<KeyPairSigner> {
    const address = await getAddressFromPublicKey(keyPair.publicKey);
    const out: KeyPairSigner = {
        address,
        keyPair,
        signMessages: messages =>
            Promise.all(
                messages.map(async message =>
                    Object.freeze({ [address]: await signBytes(keyPair.privateKey, message.content) }),
                ),
            ),
        signTransactions: transactions =>
            Promise.all(
                transactions.map(async transaction => {
                    const signedTransaction = await partiallySignTransaction([keyPair], transaction);
                    // we know that the address has signed `signedTransaction` because it comes from the keypair
                    return Object.freeze({ [address]: signedTransaction.signatures[address]! });
                }),
            ),
    };

    return Object.freeze(out);
}

/**
 * Generates a signer capable of signing messages and transactions by generating
 * a {@link CryptoKeyPair} and creating a {@link KeyPairSigner} from it.
 *
 * @example
 * ```ts
 * import { generateKeyPairSigner } from '@solana/signers';
 *
 * const signer = await generateKeyPairSigner();
 * ```
 *
 * @see {@link createSignerFromKeyPair}
 */
export async function generateKeyPairSigner(): Promise<KeyPairSigner> {
    return await createSignerFromKeyPair(await generateKeyPair());
}

/**
 * Creates a new {@link KeyPairSigner} from a 64-bytes `Uint8Array` secret key (private key and public key).
 *
 * @example
 * ```ts
 * import fs from 'fs';
 * import { createKeyPairSignerFromBytes } from '@solana/signers';
 *
 * // Get bytes from local keypair file.
 * const keypairFile = fs.readFileSync('~/.config/solana/id.json');
 * const keypairBytes = new Uint8Array(JSON.parse(keypairFile.toString()));
 *
 * // Create a KeyPairSigner from the bytes.
 * const signer = await createKeyPairSignerFromBytes(keypairBytes);
 * ```
 *
 * @see {@link createKeyPairSignerFromPrivateKeyBytes} if you only have the 32-bytes private key instead.
 */
export async function createKeyPairSignerFromBytes(
    bytes: ReadonlyUint8Array,
    extractable?: boolean,
): Promise<KeyPairSigner> {
    return await createSignerFromKeyPair(await createKeyPairFromBytes(bytes, extractable));
}

/**
 * Creates a new {@link KeyPairSigner} from a 32-bytes `Uint8Array` private key.
 *
 * @example
 * ```ts
 * import { getUtf8Encoder } from '@solana/codecs-strings';
 * import { createKeyPairSignerFromPrivateKeyBytes } from '@solana/signers';
 *
 * const message = getUtf8Encoder().encode('Hello, World!');
 * const seed = new Uint8Array(await crypto.subtle.digest('SHA-256', message));
 *
 * const derivedSigner = await createKeyPairSignerFromPrivateKeyBytes(seed);
 * ```
 *
 * @see {@link createKeyPairSignerFromBytes} if you have the 64-bytes secret key instead (private key and public key).
 */
export async function createKeyPairSignerFromPrivateKeyBytes(
    bytes: ReadonlyUint8Array,
    extractable?: boolean,
): Promise<KeyPairSigner> {
    return await createSignerFromKeyPair(await createKeyPairFromPrivateKeyBytes(bytes, extractable));
}
