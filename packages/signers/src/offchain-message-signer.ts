import { MessageSigner } from './message-signer';

/**
 * Alternative to {@link OffchainMessageWithRequiredSignerAddresses} that uses
 * {@link MessageSigner | MessageSigners} for the required signers.
 *
 * @typeParam TSigners - Optionally provide a narrower type for the
 * {@link MessageSigner | MessageSigners}.
 *
 * @example
 * ```ts
 * import { BaseOffchainMessage } from '@solana/offchain-messages';
 * import { generateKeyPairSigner, OffchainMessageWithRequiredSignerAddressesSigner } from '@solana/signers';
 *
 * const offchainMessage: BaseOffchainMessage & OffchainMessageWithRequiredSigners = {
 *     applicationDomain: offchainMessageApplicationDomain('BvxjTmN76KMSkAc8aMhYF4GA8iYidgoGw1GK6dZTxKF'),
 *     requiredSigners: [
 *         {
 *             address: address('GKdPSAkn9iQsqPUr8GBZ9bA2YowvVnGgPB2pF7zvHbhs'),
 *             async signMessages(messages) {
 *                 /* ... *\/
 *             },
 *         },
 *     ],
 *     version: 0,
 * };
 * ```
 */
export interface OffchainMessageWithRequiredSigners<TSigners extends MessageSigner[] = MessageSigner[]> {
    readonly requiredSigners: TSigners;
}
