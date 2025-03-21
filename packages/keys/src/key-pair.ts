import { assertKeyGenerationIsAvailable, assertPRNGIsAvailable } from '@solana/assertions';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH,
    SOLANA_ERROR__KEYS__PUBLIC_KEY_MUST_MATCH_PRIVATE_KEY,
    SolanaError,
} from '@solana/errors';

import { ED25519_ALGORITHM_IDENTIFIER } from './algorithm';
import { createPrivateKeyFromBytes } from './private-key';
import { getPublicKeyFromPrivateKey } from './public-key';
import { signBytes, verifySignature } from './signatures';

/**
 * Generates an Ed25519 public/private key pair for use with other methods in this package that
 * accept [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey) objects.
 *
 * @example
 * ```ts
 * import { generateKeyPair } from '@solana/keys';
 *
 * const { privateKey, publicKey } = await generateKeyPair();
 * ```
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
    await assertKeyGenerationIsAvailable();
    const keyPair = await crypto.subtle.generateKey(
        /* algorithm */ ED25519_ALGORITHM_IDENTIFIER, // Native implementation status: https://github.com/WICG/webcrypto-secure-curves/issues/20
        /* extractable */ false, // Prevents the bytes of the private key from being visible to JS.
        /* allowed uses */ ['sign', 'verify'],
    );
    return keyPair;
}

/**
 * Given a 64-byte `Uint8Array` secret key, creates an Ed25519 public/private key pair for use with
 * other methods in this package that accept [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)
 * objects.
 *
 * @param bytes 64 bytes, the first 32 of which represent the private key and the last 32 of which
 * represent its associated public key
 * @param extractable Setting this to `true` makes it possible to extract the bytes of the private
 * key using the [`crypto.subtle.exportKey()`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey)
 * API. Defaults to `false`.
 *
 * @example
 * ```ts
 * import fs from 'fs';
 * import { createKeyPairFromBytes } from '@solana/keys';
 *
 * // Get bytes from local keypair file.
 * const keypairFile = fs.readFileSync('~/.config/solana/id.json');
 * const keypairBytes = new Uint8Array(JSON.parse(keypairFile.toString()));
 *
 * // Create a CryptoKeyPair from the bytes.
 * const { privateKey, publicKey } = await createKeyPairFromBytes(keypairBytes);
 * ```
 */
export async function createKeyPairFromBytes(
    bytes: ReadonlyUint8Array,
    extractable: boolean = false,
): Promise<CryptoKeyPair> {
    assertPRNGIsAvailable();

    if (bytes.byteLength !== 64) {
        throw new SolanaError(SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH, { byteLength: bytes.byteLength });
    }
    const [publicKey, privateKey] = await Promise.all([
        crypto.subtle.importKey('raw', bytes.slice(32), ED25519_ALGORITHM_IDENTIFIER, /* extractable */ true, [
            'verify',
        ]),
        createPrivateKeyFromBytes(bytes.slice(0, 32), extractable),
    ]);

    // Verify the key pair
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const signedData = await signBytes(privateKey, randomBytes);
    const isValid = await verifySignature(publicKey, signedData, randomBytes);
    if (!isValid) {
        throw new SolanaError(SOLANA_ERROR__KEYS__PUBLIC_KEY_MUST_MATCH_PRIVATE_KEY);
    }

    return { privateKey, publicKey } as CryptoKeyPair;
}

/**
 * Given a private key represented as a 32-byte `Uint8Array`, creates an Ed25519 public/private key
 * pair for use with other methods in this package that accept [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)
 * objects.
 *
 * @param bytes 32 bytes that represent the private key
 * @param extractable Setting this to `true` makes it possible to extract the bytes of the private
 * key using the [`crypto.subtle.exportKey()`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey)
 * API. Defaults to `false`.
 *
 * @example
 * ```ts
 * import { createKeyPairFromPrivateKeyBytes } from '@solana/keys';
 *
 * const { privateKey, publicKey } = await createKeyPairFromPrivateKeyBytes(new Uint8Array([...]));
 * ```
 *
 * This can be useful when you have a private key but not the corresponding public key or when you
 * need to derive key pairs from seeds. For instance, the following code snippet derives a key pair
 * from the hash of a message.
 *
 * ```ts
 * import { getUtf8Encoder } from '@solana/codecs-strings';
 * import { createKeyPairFromPrivateKeyBytes } from '@solana/keys';
 *
 * const message = getUtf8Encoder().encode('Hello, World!');
 * const seed = new Uint8Array(await crypto.subtle.digest('SHA-256', message));
 *
 * const derivedKeypair = await createKeyPairFromPrivateKeyBytes(seed);
 * ```
 */
export async function createKeyPairFromPrivateKeyBytes(
    bytes: ReadonlyUint8Array,
    extractable: boolean = false,
): Promise<CryptoKeyPair> {
    const privateKeyPromise = createPrivateKeyFromBytes(bytes, extractable);

    // Here we need the private key to be extractable in order to export
    // it as a public key. Therefore, if the `extractable` parameter
    // is `false`, we need to create two private keys such that:
    //   - The extractable one is used to create the public key and
    //   - The non-extractable one is the one we will return.
    const [publicKey, privateKey] = await Promise.all([
        // This nested promise makes things efficient by
        // creating the public key in parallel with the
        // second private key creation, if it is needed.
        (extractable ? privateKeyPromise : createPrivateKeyFromBytes(bytes, true /* extractable */)).then(
            async privateKey => await getPublicKeyFromPrivateKey(privateKey, true /* extractable */),
        ),
        privateKeyPromise,
    ]);

    return { privateKey, publicKey };
}
