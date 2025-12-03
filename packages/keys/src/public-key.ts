import { assertKeyExporterIsAvailable } from '@solana/assertions';
import { SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY, SolanaError } from '@solana/errors';

/**
 * Given an extractable [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)
 * private key, gets the corresponding public key as a
 * [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey).
 *
 * @param extractable Setting this to `true` makes it possible to extract the bytes of the public
 * key using the [`crypto.subtle.exportKey()`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey)
 * API. Defaults to `false`.
 *
 * @example
 * ```ts
 * import { createPrivateKeyFromBytes, getPublicKeyFromPrivateKey } from '@solana/keys';
 *
 * const privateKey = await createPrivateKeyFromBytes(new Uint8Array([...]), true);
 *
 * const publicKey = await getPublicKeyFromPrivateKey(privateKey);
 * const extractablePublicKey = await getPublicKeyFromPrivateKey(privateKey, true);
 * ```
 */
export async function getPublicKeyFromPrivateKey(
    privateKey: CryptoKey,
    extractable: boolean = false,
): Promise<CryptoKey> {
    assertKeyExporterIsAvailable();

    if (privateKey.extractable === false) {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY, { key: privateKey });
    }

    // Export private key.
    const jwk = await crypto.subtle.exportKey('jwk', privateKey);

    // Import public key.
    return await crypto.subtle.importKey(
        'jwk',
        {
            crv /* curve */: 'Ed25519',
            ext /* extractable */: extractable,
            key_ops /* key operations */: ['verify'],
            kty /* key type */: 'OKP' /* octet key pair */,
            x /* public key x-coordinate */: jwk.x,
        },
        'Ed25519',
        extractable,
        ['verify'],
    );
}
