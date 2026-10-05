import { assertKeyExporterIsAvailable } from '@solana/assertions';
import { SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY, SolanaError } from '@solana/errors';

/**
 * Given an extractable [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)
 * private key, gets the corresponding public key as a
 * [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey).
 *
 * The public key is always extractable, since public keys are not secret. This mirrors the
 * behavior of [`crypto.subtle.generateKey()`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey),
 * and is required by {@link verifySignature}, which reads the bytes of the public key.
 *
 * @example
 * ```ts
 * import { createPrivateKeyFromBytes, getPublicKeyFromPrivateKey } from '@solana/keys';
 *
 * const privateKey = await createPrivateKeyFromBytes(new Uint8Array([...]), true);
 *
 * const publicKey = await getPublicKeyFromPrivateKey(privateKey);
 * ```
 */
export async function getPublicKeyFromPrivateKey(privateKey: CryptoKey): Promise<CryptoKey>;
/**
 * @param extractable Ignored; the public key is always extractable.
 * @deprecated The `extractable` argument is ignored; the public key is always extractable. Omit it.
 */
export async function getPublicKeyFromPrivateKey(privateKey: CryptoKey, extractable: boolean): Promise<CryptoKey>;
export async function getPublicKeyFromPrivateKey(privateKey: CryptoKey, _extractable?: boolean): Promise<CryptoKey> {
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
            ext /* extractable */: true,
            key_ops /* key operations */: ['verify'],
            kty /* key type */: 'OKP' /* octet key pair */,
            x /* public key x-coordinate */: jwk.x,
        },
        'Ed25519',
        true /* extractable */,
        ['verify'],
    );
}
