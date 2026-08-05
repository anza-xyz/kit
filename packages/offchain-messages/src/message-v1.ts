import { Address } from '@solana/addresses';
import { getUtf8Encoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__REQUIRED_SIGNATORIES_DO_NOT_MATCH_EXPECTED,
    SolanaError,
} from '@solana/errors';

import { OffchainMessagePreambleV1 } from './preamble-v1';
import { OffchainMessageWithRequiredSignatories } from './signatures';

export type BaseOffchainMessageV1 = Omit<OffchainMessagePreambleV1, 'requiredSignatories'>;

export type OffchainMessageV1 = BaseOffchainMessageV1 &
    OffchainMessageWithRequiredSignatories &
    Readonly<{
        content: string;
    }>;

function getSortedSignatoryAddresses(message: OffchainMessageV1): readonly Address[] {
    return message.requiredSignatories.map(({ address }) => address).toSorted();
}

/**
 * Asserts that a version 1 offchain message you received from an untrusted source is the message
 * that you expected it to be.
 *
 * A signer (eg. a wallet) returns the message bytes it signed alongside its signature. Verifying
 * that signature proves only that the signer produced it over *those* bytes; it says nothing about
 * whether those bytes represent the message you asked for. Use this function to establish that they
 * do, then verify the signature separately with {@link verifyOffchainMessageEnvelope}.
 *
 * Perform this assertion _before_ verifying signatures. A signer that signed the wrong message will
 * otherwise surface as a signature verification failure, which misattributes the problem to the
 * cryptography rather than to the content.
 *
 * This function compares version 1 messages only. Decoding produces an {@link OffchainMessage} of
 * indeterminate version, so narrow it to a {@link OffchainMessageV1} before calling this — see the
 * example below. Deciding what to do about a message of some other version is a matter of policy
 * that belongs to you rather than to this function.
 *
 * @param receivedMessage The message you decoded from the bytes the signer reports having signed.
 * @param expectedMessage The message you expected the signer to sign.
 *
 * @throws A {@link SolanaError} with code
 * {@link SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED} if the two messages'
 * contents differ.
 * @throws A {@link SolanaError} with code
 * {@link SOLANA_ERROR__OFFCHAIN_MESSAGE__REQUIRED_SIGNATORIES_DO_NOT_MATCH_EXPECTED} if the two
 * messages require signatures from different addresses.
 *
 * @example
 * ```ts
 * import { getOffchainMessageDecoder, assertOffchainMessageV1Equal } from '@solana/offchain-messages';
 *
 * const receivedMessage = getOffchainMessageDecoder().decode(signedOffchainMessage);
 * switch (receivedMessage.version) {
 *     case 1:
 *         assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
 *         break;
 *     default:
 *         throw new Error(`Expected a version 1 message; got version ${receivedMessage.version}`);
 * }
 * ```
 *
 * @remarks
 * Required signatories are compared without regard to order. The offchain message specification
 * mandates that they be serialized in lexicographic order, so a decoded message always lists them in
 * that order while `expectedMessage` may list them in whatever order you built it with. Both lists
 * are sorted before they are compared, and they are reported in sorted order in the error context so
 * that they can be compared by eye.
 *
 * Order is the only thing ignored. The lists are otherwise compared element by element, so listing
 * an address twice in `expectedMessage` is a mismatch rather than a no-op. A decoded message can
 * never contain a duplicate — the codec rejects one — so this only arises from a malformed
 * `expectedMessage`, and reporting it surfaces the mistake instead of hiding it.
 *
 * Message content is not included in the error context, because it can carry data you would rather
 * not have written to logs or forwarded to an error reporting service. Its length in UTF-8 bytes —
 * the encoding in which version 1 content is serialized — is reported instead.
 *
 * @see {@link verifyOffchainMessageEnvelope} to verify the signatures themselves once you know the
 * message is the one you expected.
 */
export function assertOffchainMessageV1Equal(
    receivedMessage: OffchainMessageV1,
    expectedMessage: OffchainMessageV1,
): void {
    if (receivedMessage.content !== expectedMessage.content) {
        const utf8Encoder = getUtf8Encoder();
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED, {
            actualBytes: utf8Encoder.getSizeFromValue(receivedMessage.content),
            expectedBytes: utf8Encoder.getSizeFromValue(expectedMessage.content),
        });
    }
    const actualAddresses = getSortedSignatoryAddresses(receivedMessage);
    const expectedAddresses = getSortedSignatoryAddresses(expectedMessage);
    if (
        actualAddresses.length !== expectedAddresses.length ||
        actualAddresses.some((address, ii) => address !== expectedAddresses[ii])
    ) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__REQUIRED_SIGNATORIES_DO_NOT_MATCH_EXPECTED, {
            actualAddresses,
            expectedAddresses,
        });
    }
}
