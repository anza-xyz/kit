import { Address } from '@solana/addresses';
import { PublicKey } from '@solana/web3.js';

/**
 * Converts a legacy [PublicKey](https://solana-foundation.github.io/solana-web3.js/classes/PublicKey.html)
 * object to an {@link Address}.
 *
 * @example
 * ```ts
 * import { fromLegacyPublicKey } from '@solana/compat';
 *
 * const legacyPublicKey = new PublicKey('49XBVQsvSW44ULKL9qufS9YqQPbdcps1TQRijx4FQ9sH');
 * const address = fromLegacyPublicKey(legacyPublicKey);
 * ```
 */
export function fromLegacyPublicKey<TAddress extends string>(publicKey: PublicKey): Address<TAddress> {
    return publicKey.toBase58() as Address<TAddress>;
}
