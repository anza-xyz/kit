import { assertKeyExporterIsAvailable } from '@solana/assertions';
import { SOLANA_ERROR__ADDRESSES__INVALID_ED25519_PUBLIC_KEY, SolanaError } from '@solana/errors';

import { Address, getAddressDecoder, getAddressEncoder } from './address';

/**
 * Given a public {@link CryptoKey}, this method will return its associated {@link Address}.
 *
 * @example
 * ```ts
 * import { getAddressFromPublicKey } from '@solana/addresses';
 *
 * const address = await getAddressFromPublicKey(publicKey);
 * ```
 */
export async function getAddressFromPublicKey(publicKey: CryptoKey): Promise<Address> {
    assertKeyExporterIsAvailable();
    if (publicKey.type !== 'public' || publicKey.algorithm.name !== 'Ed25519') {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__INVALID_ED25519_PUBLIC_KEY);
    }
    const publicKeyBytes = await crypto.subtle.exportKey('raw', publicKey);
    return getAddressDecoder().decode(new Uint8Array(publicKeyBytes));
}

/**
 * Given an {@link Address}, return a {@link CryptoKey} that can be used to verify signatures.
 *
 * @example
 * ```ts
 * import { getAddressFromPublicKey } from '@solana/addresses';
 *
 * const publicKey = await getPublicKeyFromAddress(address);
 * ```
 */
export async function getPublicKeyFromAddress(address: Address) {
    const addressBytes = getAddressEncoder().encode(address);
    return await crypto.subtle.importKey('raw', addressBytes, { name: 'Ed25519' }, true /* extractable */, ['verify']);
}
