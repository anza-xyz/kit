import { Address } from '@solana/addresses';
import { SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING, SolanaError } from '@solana/errors';
import { NominalType } from '@solana/nominal-types';

import { OffchainMessageEnvelope } from './envelope';

/**
 * Represents an offchain message envelope that is signed by all of its required signers.
 */
export type FullySignedOffchainMessageEnvelope = NominalType<'offchainMessageEnvelopeSignedness', 'fullySigned'>;

/**
 * Checks whether a given {@link OffchainMessageEnvelope} is fully signed.
 *
 * @example
 * ```ts
 * import { isFullySignedOffchainMessageEnvelope } from '@solana/offchain-messages';
 *
 * const offchainMessageEnvelope = getOffchainMessageDecoder().decode(offchainMessageBytes);
 * if (isFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)) {
 *   // At this point we know that the offchain message is fully signed.
 * }
 * ```
 */
export function isFullySignedOffchainMessageEnvelope<TEnvelope extends OffchainMessageEnvelope>(
    offchainMessage: TEnvelope,
): offchainMessage is FullySignedOffchainMessageEnvelope & TEnvelope {
    return Object.entries(offchainMessage.signatures).every(([_, signatureBytes]) => !!signatureBytes);
}

/**
 * From time to time you might acquire a {@link OffchainMessageEnvelope}, that you expect to be
 * fully signed, from an untrusted network API or user input. Use this function to assert that such
 * an offchain message is fully signed.
 *
 * @example
 * ```ts
 * import { assertIsFullySignedOffchainMessage } from '@solana/offchain-messages';
 *
 * const offchainMessageEnvelope = getOffchainMessageDecoder().decode(offchainMessageBytes);
 * try {
 *     // If this type assertion function doesn't throw, then Typescript will upcast
 *     // `offchainMessageEnvelope` to `FullySignedOffchainMessageEnvelope`.
 *     assertIsFullySignedOffchainMessageEnvelope(offchainMessage);
 *     // At this point we know that the offchain message is signed by all required signers.
 * } catch(e) {
 *     if (isSolanaError(e, SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING)) {
 *         setError(`Missing signatures for ${e.context.addresses.join(', ')}`);
 *     } else {
 *         throw e;
 *     }
 * }
 * ```
 */
export function assertIsFullySignedOffchainMessageEnvelope<TEnvelope extends OffchainMessageEnvelope>(
    offchainMessage: TEnvelope,
): asserts offchainMessage is FullySignedOffchainMessageEnvelope & TEnvelope {
    const missingSigs: Address[] = [];
    Object.entries(offchainMessage.signatures).forEach(([address, signatureBytes]) => {
        if (!signatureBytes) {
            missingSigs.push(address as Address);
        }
    });

    if (missingSigs.length > 0) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING, {
            addresses: missingSigs,
        });
    }
}
