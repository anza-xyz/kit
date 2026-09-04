import { Address, getAddressDecoder } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import { SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH, SolanaError } from '@solana/errors';

import { createKeyPairSignerFromBytes, KeyPairSigner } from './keypair-signer';
import { MessagePartialSigner } from './message-partial-signer';
import { TransactionPartialSigner } from './transaction-partial-signer';

/**
 * Creates a signer from a 64-bytes `Uint8Array` secret key (private key and public key) **synchronously**.
 *
 * Unlike {@link createKeyPairSignerFromBytes}, this helper returns without awaiting. It derives the
 * signer's {@link MessagePartialSigner#address | address} directly from the public key half of the
 * secret key (the last 32 bytes) and defers the asynchronous {@link CryptoKey} import until the first
 * time a message or transaction is signed. The imported key pair is memoised so the import only
 * happens once, no matter how many times the signer is used.
 *
 * This is useful when a signer must be created in a synchronous context — for instance, when
 * registering signers up front — whilst the actual signing can remain asynchronous.
 *
 * @typeParam TAddress - Supply a string literal to define a signer having a particular address.
 *
 * @param bytes - A 64-bytes secret key, the first 32 of which represent the private key and the last
 * 32 of which represent its associated public key.
 * @param extractable - Setting this to `true` makes it possible to extract the bytes of the private
 * key using the [`crypto.subtle.exportKey()`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey)
 * API. Defaults to `false`. Note that, because the import is deferred, this helper keeps a copy of the
 * secret key bytes in memory until the first signing call completes, regardless of this setting.
 *
 * @returns A signer implementing both the {@link MessagePartialSigner} and {@link TransactionPartialSigner}
 * interfaces. Note that, because the {@link CryptoKeyPair} is imported lazily, this signer does not
 * expose a `keyPair` property and is therefore not a full {@link KeyPairSigner}.
 *
 * @throws {@link SolanaError} with code `SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH` if the
 * provided `bytes` are not exactly 64 bytes long. This check is performed synchronously.
 *
 * @example
 * ```ts
 * import fs from 'fs';
 * import { createLazyKeyPairSignerFromBytes } from '@solana/signers';
 *
 * // Get bytes from local keypair file.
 * const keypairFile = fs.readFileSync('~/.config/solana/id.json');
 * const keypairBytes = new Uint8Array(JSON.parse(keypairFile.toString()));
 *
 * // Create a signer from the bytes synchronously.
 * const signer = createLazyKeyPairSignerFromBytes(keypairBytes);
 * signer.address; // Available immediately, no `await` required.
 * const [transactionSignatures] = await signer.signTransactions([transaction]);
 * ```
 *
 * @remarks
 * Because the {@link CryptoKey} import is deferred, the cryptographic check that the public key half
 * of the secret key matches its private key half — which {@link createKeyPairSignerFromBytes}
 * performs eagerly — is also deferred. A mismatched or corrupt secret key therefore throws on the
 * first signing attempt rather than at creation time. Only the 64-bytes length is validated
 * synchronously.
 *
 * Since the import is deferred, the provided `bytes` are copied on creation so that the signer keeps
 * working even if the caller mutates or zeroes their buffer before the first signing attempt. This
 * internal copy is zeroed as soon as the import succeeds, so the plaintext secret key does not linger
 * in memory beyond the first signing call.
 *
 * If the deferred import fails, the failure is **not** cached: the next signing call will attempt the
 * import again. This means a transient failure can be retried, whilst a genuinely mismatched or
 * corrupt secret key will fail on every attempt.
 *
 * @see {@link createKeyPairSignerFromBytes} for the asynchronous variant that eagerly validates the
 * secret key and exposes the {@link CryptoKeyPair} via a `keyPair` property.
 */
export function createLazyKeyPairSignerFromBytes<TAddress extends string = string>(
    bytes: ReadonlyUint8Array,
    extractable?: boolean,
): MessagePartialSigner<TAddress> & TransactionPartialSigner<TAddress> {
    if (bytes.byteLength !== 64) {
        throw new SolanaError(SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH, { byteLength: bytes.byteLength });
    }

    // Copy the bytes so the signer keeps working if the caller mutates or zeroes their buffer before
    // the deferred import runs.
    const secretKeyBytes = Uint8Array.from(bytes);
    const address = getAddressDecoder().decode(secretKeyBytes, 32) as Address<TAddress>;

    let keyPairSignerPromise: Promise<KeyPairSigner> | undefined;
    const getKeyPairSigner = () =>
        (keyPairSignerPromise ??= createKeyPairSignerFromBytes(secretKeyBytes, extractable).then(
            signer => {
                // The import copied the bytes it needed, so release our plaintext copy now.
                secretKeyBytes.fill(0);
                return signer;
            },
            error => {
                // Don't cache the failure; allow a subsequent call to retry the import.
                keyPairSignerPromise = undefined;
                throw error;
            },
        ));

    return Object.freeze({
        address,
        signMessages: async (messages, config) => await (await getKeyPairSigner()).signMessages(messages, config),
        signTransactions: async (transactions, config) =>
            await (await getKeyPairSigner()).signTransactions(transactions, config),
    });
}
