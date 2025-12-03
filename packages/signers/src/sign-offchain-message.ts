import {
    assertIsFullySignedOffchainMessageEnvelope,
    compileOffchainMessageEnvelope,
    FullySignedOffchainMessageEnvelope,
    OffchainMessage,
    OffchainMessageEnvelope,
    OffchainMessageSignatory,
    OffchainMessageWithRequiredSignatories,
} from '@solana/offchain-messages';

import {
    isMessageModifyingSigner,
    MessageModifyingSigner,
    MessageModifyingSignerConfig,
} from './message-modifying-signer';
import { isMessagePartialSigner, MessagePartialSigner, MessagePartialSignerConfig } from './message-partial-signer';
import { MessageSigner } from './message-signer';
import { getSignersFromOffchainMessage, OffchainMessageSignatorySigner } from './offchain-message-signer';
import { SignableMessage } from './signable-message';

/**
 * Extracts all {@link MessageSigner | MessageSigners} inside the provided offchain message and uses
 * them to return a signed offchain message envelope.
 *
 * It first uses all {@link MessageModifyingSigner | MessageModifyingSigners} sequentially before
 * using all {@link MessagePartialSigner | MessagePartialSigners} in parallel.
 *
 * If a composite signer implements both interfaces, it will be used as a
 * {@link MessageModifyingSigner} if no other signer implements that interface. Otherwise, it will
 * be used as a {@link MessagePartialSigner}.
 *
 * @example
 * ```ts
 * const signedOffchainMessageEnvelope = await partiallySignOffchainMessageWithSigners(offchainMessage);
 * ```
 *
 * It also accepts an optional {@link AbortSignal} that will be propagated to all signers.
 *
 * ```ts
 * const signedOffchainMessageEnvelope = await partiallySignOffchainMessageWithSigners(offchainMessage, {
 *     abortSignal: myAbortController.signal,
 * });
 * ```
 *
 * @see {@link signOffchainMessageWithSigners}
 */
export async function partiallySignOffchainMessageWithSigners(
    offchainMessage: OffchainMessageWithRequiredSignatories<OffchainMessageSignatory | OffchainMessageSignatorySigner> &
        Omit<OffchainMessage, 'requiredSignatories'>,
    config?: MessagePartialSignerConfig,
): Promise<OffchainMessageEnvelope> {
    const { partialSigners, modifyingSigners } = categorizeMessageSigners(
        getSignersFromOffchainMessage(offchainMessage),
    );
    return await signModifyingAndPartialMessageSigners(offchainMessage, modifyingSigners, partialSigners, config);
}

/**
 * Extracts all {@link MessageSigner | MessageSigners} inside the provided offchain message and uses
 * them to return a signed offchain message envelope before asserting that all signatures required
 * by the message are present.
 *
 * This function delegates to the {@link partiallySignOffchainMessageWithSigners} function
 * in order to extract signers from the offchain message and sign it.
 *
 * @example
 * ```ts
 * const mySignedOffchainMessageEnvelope = await signOffchainMessageWithSigners(myOffchainMessage);
 *
 * // With additional config.
 * const mySignedOffchainMessageEnvelope = await signOffchainMessageWithSigners(myOffchainMessage, {
 *     abortSignal: myAbortController.signal,
 * });
 *
 * // We now know the offchain message is fully signed.
 * mySignedOffchainMessageEnvelope satisfies FullySignedOffchainMessageEnvelope;
 * ```
 *
 * @see {@link partiallySignOffchainMessageWithSigners}
 */
export async function signOffchainMessageWithSigners(
    offchainMessage: OffchainMessageWithRequiredSignatories<OffchainMessageSignatory | OffchainMessageSignatorySigner> &
        Omit<OffchainMessage, 'requiredSignatories'>,
    config?: MessagePartialSignerConfig,
): Promise<FullySignedOffchainMessageEnvelope & OffchainMessageEnvelope> {
    const signedOffchainMessageEnvelope = await partiallySignOffchainMessageWithSigners(offchainMessage, config);
    assertIsFullySignedOffchainMessageEnvelope(signedOffchainMessageEnvelope);
    return signedOffchainMessageEnvelope;
}

/**
 * Identifies each provided {@link MessageSigner} and categorizes them into their respective types.
 * When a signer implements multiple interfaces, it will try to used to most powerful interface but
 * fall back to the least powerful interface when necessary.
 *
 * For instance, if a signer implements {@link MessageSigner} and {@link MessageModifyingSigner},
 * it will be categorized as a `MessageModifyingSigner`.
 */
function categorizeMessageSigners(signers: readonly MessageSigner[]): Readonly<{
    modifyingSigners: readonly MessageModifyingSigner[];
    partialSigners: readonly MessagePartialSigner[];
}> {
    // Identify the modifying signers from the other signers.
    const modifyingSigners = identifyMessageModifyingSigners(signers);

    // Use any remaining signers as partial signers.
    const partialSigners = signers
        .filter(isMessagePartialSigner)
        .filter(signer => !(modifyingSigners as typeof signers).includes(signer));

    return Object.freeze({ modifyingSigners, partialSigners });
}

/** Identifies the best signers to use as MessageModifyingSigners, if any */
function identifyMessageModifyingSigners(
    signers: readonly (MessageModifyingSigner | MessagePartialSigner)[],
): readonly MessageModifyingSigner[] {
    // Ensure there are any MessageModifyingSigner in the first place.
    const modifyingSigners = signers.filter(isMessageModifyingSigner);
    if (modifyingSigners.length === 0) return [];

    // Prefer modifying signers that do not offer partial signing.
    const nonPartialSigners = modifyingSigners.filter(signer => !isMessagePartialSigner(signer));
    if (nonPartialSigners.length > 0) return nonPartialSigners;

    // Otherwise, choose only one modifying signer (whichever).
    return [modifyingSigners[0]];
}

/**
 * Signs an offchain message using the provided
 * {@link MessageModifyingSigner | MessageModifyingSigners} sequentially followed by the
 * {@link MessagePartialSigner | MessagePartialSigners} in parallel.
 */
async function signModifyingAndPartialMessageSigners(
    offchainMessage: OffchainMessageWithRequiredSignatories<OffchainMessageSignatory | OffchainMessageSignatorySigner> &
        Omit<OffchainMessage, 'requiredSignatories'>,
    modifyingSigners: readonly MessageModifyingSigner[] = [],
    partialSigners: readonly MessagePartialSigner[] = [],
    config?: MessageModifyingSignerConfig,
): Promise<OffchainMessageEnvelope> {
    // @ts-expect-error SignableMessage should probably specify `ReadonlyUint8Array` here.
    const offchainMessageEnvelope: SignableMessage = compileOffchainMessageEnvelope(offchainMessage);

    // Handle modifying signers sequentially.
    const modifiedOffchainMessage = await modifyingSigners.reduce(async (offchainMessageEnvelope, modifyingSigner) => {
        config?.abortSignal?.throwIfAborted();
        const [message] = await modifyingSigner.modifyAndSignMessages([await offchainMessageEnvelope], config);
        return Object.freeze(message);
    }, Promise.resolve(offchainMessageEnvelope));

    // Handle partial signers in parallel.
    config?.abortSignal?.throwIfAborted();
    const signatureDictionaries = await Promise.all(
        partialSigners.map(async partialSigner => {
            const [signatures] = await partialSigner.signMessages([modifiedOffchainMessage], config);
            return signatures;
        }),
    );

    // @ts-expect-error SignableMessage should probably specify `ReadonlyUint8Array` here.
    return Object.freeze({
        ...modifiedOffchainMessage,
        signatures: Object.freeze(
            signatureDictionaries.reduce((signatures, signatureDictionary) => {
                return { ...signatures, ...signatureDictionary };
            }, modifiedOffchainMessage.signatures ?? {}),
        ),
    } as OffchainMessageEnvelope);
}
