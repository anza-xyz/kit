import { Address, getAddressFromPublicKey, getPublicKeyFromAddress } from '@solana/addresses';
import { bytesEqual, ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING,
    SolanaError,
} from '@solana/errors';
import { SignatureBytes, signBytes, verifySignature } from '@solana/keys';
import { NominalType } from '@solana/nominal-types';

import { getOffchainMessageV1Encoder } from './codecs/message-v1';
import { decodeRequiredSignatoryAddresses } from './codecs/preamble-common';
import { OffchainMessageEnvelope } from './envelope';
import { OffchainMessageV1 } from './message-v1';

/**
 * Represents an offchain message envelope that is signed by all of its required signers.
 */
export type FullySignedOffchainMessageEnvelope = NominalType<'offchainMessageEnvelopeSignedness', 'fullySigned'>;

/**
 * Represents an address that is required to sign an offchain message for it to be valid.
 */
export type OffchainMessageSignatory<TAddress extends string = string> = Readonly<{
    address: Address<TAddress>;
}>;

/**
 * An offchain message having a list of accounts that must sign it in order for it to be valid.
 */
export interface OffchainMessageWithRequiredSignatories<
    TSignatory extends OffchainMessageSignatory = OffchainMessageSignatory,
> {
    requiredSignatories: readonly TSignatory[];
}

/**
 * Given an array of `CryptoKey` objects which are private keys pertaining to addresses that are
 * required to sign an offchain message, this method will return a new signed offchain message
 * envelope of type {@link OffchainMessageEnvelope}.
 *
 * Though the resulting message might be signed by all required signers, this function will not
 * assert that it is. A partially signed message is not complete, but can be serialized and
 * deserialized.
 *
 * @example
 * ```ts
 * import { generateKeyPair } from '@solana/keys';
 * import { partiallySignOffchainMessageEnvelope } from '@solana/offchain-messages';
 *
 * const partiallySignedOffchainMessage = await partiallySignOffchainMessageEnvelope(
 *     [myPrivateKey],
 *     offchainMessageEnvelope,
 * );
 * ```
 *
 * @see {@link signOffchainMessageEnvelope} if you want to assert that the message is signed by all
 * its required signers after signing.
 */
export async function partiallySignOffchainMessageEnvelope<TOffchainMessageEnvelope extends OffchainMessageEnvelope>(
    keyPairs: CryptoKeyPair[],
    offchainMessageEnvelope: TOffchainMessageEnvelope,
): Promise<TOffchainMessageEnvelope> {
    let newSignatures: Record<Address, SignatureBytes> | undefined;
    let unexpectedSigners: Set<Address> | undefined;

    const requiredSignatoryAddresses = decodeRequiredSignatoryAddresses(offchainMessageEnvelope.content);

    await Promise.all(
        keyPairs.map(async keyPair => {
            const address = await getAddressFromPublicKey(keyPair.publicKey);

            // Check if the address is expected to sign the message
            if (!requiredSignatoryAddresses.includes(address)) {
                // address is not an expected signer for this message
                unexpectedSigners ||= new Set();
                unexpectedSigners.add(address);
                return;
            }

            // Return if there are any unexpected signers already since we won't be using signatures
            if (unexpectedSigners) {
                return;
            }

            const existingSignature = offchainMessageEnvelope.signatures[address];
            const newSignature = await signBytes(keyPair.privateKey, offchainMessageEnvelope.content);

            if (existingSignature != null && bytesEqual(newSignature, existingSignature)) {
                // already have the same signature set
                return;
            }

            newSignatures ||= {};
            newSignatures[address] = newSignature;
        }),
    );

    if (unexpectedSigners && unexpectedSigners.size > 0) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE, {
            expectedAddresses: requiredSignatoryAddresses,
            unexpectedAddresses: [...unexpectedSigners],
        });
    }

    if (!newSignatures) {
        return offchainMessageEnvelope;
    }

    return Object.freeze({
        ...offchainMessageEnvelope,
        signatures: Object.freeze({
            ...offchainMessageEnvelope.signatures,
            ...newSignatures,
        }),
    });
}

/**
 * Given an array of `CryptoKey` objects which are private keys pertaining to addresses that are
 * required to sign an offchain message envelope, this method will return a new signed envelope of
 * type {@link FullySignedOffchainMessageEnvelope}.
 *
 * This function will throw unless the resulting message is fully signed.
 *
 * @example
 * ```ts
 * import { generateKeyPair } from '@solana/keys';
 * import { signOffchainMessageEnvelope } from '@solana/offchain-messages';
 *
 * const signedOffchainMessage = await signOffchainMessageEnvelope(
 *     [myPrivateKey],
 *     offchainMessageEnvelope,
 * );
 * ```
 *
 * @see {@link partiallySignOffchainMessageEnvelope} if you want to sign the message without
 * asserting that the resulting message envelope is fully signed.
 */
export async function signOffchainMessageEnvelope<TOffchainMessageEnvelope extends OffchainMessageEnvelope>(
    keyPairs: CryptoKeyPair[],
    offchainMessageEnvelope: TOffchainMessageEnvelope,
): Promise<FullySignedOffchainMessageEnvelope & TOffchainMessageEnvelope> {
    const out = await partiallySignOffchainMessageEnvelope(keyPairs, offchainMessageEnvelope);
    assertIsFullySignedOffchainMessageEnvelope(out);
    Object.freeze(out);
    return out;
}

/**
 * A type guard that returns `true` if the input {@link OffchainMessageEnvelope} is fully signed,
 * and refines its type for use in your program, adding the
 * {@link FullySignedOffchainMessageEnvelope} type.
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

/**
 * Asserts that there are signatures present for all of an offchain message's required signatories,
 * and that those signatures are valid given the message.
 *
 * @example
 * ```ts
 * import { isSolanaError, SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE } from '@solana/errors';
 * import { verifyOffchainMessageEnvelope } from '@solana/offchain-messages';
 *
 * try {
 *     await verifyOffchainMessageEnvelope(offchainMessageEnvelope);
 *     // At this point the message is valid and signed by all of the required signatories.
 * } catch (e) {
 *     if (isSolanaError(e, SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE)) {
 *         if (e.context.signatoriesWithMissingSignatures.length) {
 *             console.error(
 *                 'Missing signatures for the following addresses',
 *                 e.context.signatoriesWithMissingSignatures,
 *             );
 *         }
 *         if (e.context.signatoriesWithInvalidSignatures.length) {
 *             console.error(
 *                 'Signatures for the following addresses are invalid',
 *                 e.context.signatoriesWithInvalidSignatures,
 *             );
 *         }
 *     }
 *     throw e;
 * }
 */
export async function verifyOffchainMessageEnvelope(offchainMessageEnvelope: OffchainMessageEnvelope): Promise<void> {
    let errorContext;
    const requiredSignatories = decodeRequiredSignatoryAddresses(offchainMessageEnvelope.content);
    await Promise.all(
        requiredSignatories.map(async address => {
            const signature = offchainMessageEnvelope.signatures[address];
            if (signature == null) {
                errorContext ||= {};
                errorContext.signatoriesWithMissingSignatures ||= [];
                errorContext.signatoriesWithMissingSignatures.push(address);
            } else {
                const publicKey = await getPublicKeyFromAddress(address);
                if (await verifySignature(publicKey, signature, offchainMessageEnvelope.content)) {
                    return true;
                } else {
                    errorContext ||= {};
                    errorContext.signatoriesWithInvalidSignatures ||= [];
                    errorContext.signatoriesWithInvalidSignatures.push(address);
                }
            }
        }),
    );
    if (errorContext) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE, errorContext);
    }
}

/**
 * The inputs required to verify a signed offchain message returned by a signer (eg. a wallet).
 *
 * @see {@link verifyOffchainMessage}
 */
export type VerifyOffchainMessageInput = Readonly<{
    /** The text content of the message you asked the signer to sign. */
    message: string;
    /**
     * The complete set of addresses you required to sign the message. You may list them in any
     * order; they are reordered as the spec mandates when reconstructing the expected message.
     *
     * @defaultValue `[signer]` — the common case of a message that only the connected wallet needs
     * to sign.
     */
    requiredSigners?: readonly Address[];
    /** The 64-byte Ed25519 signature returned by the signer. */
    signature: SignatureBytes;
    /** The bytes that the signer reports having signed. */
    signedMessageBytes: ReadonlyUint8Array;
    /** The address whose private key is claimed to have produced {@link signature}. */
    signer: Address;
}>;

/**
 * Verifies a signed offchain message returned by an untrusted signer (eg. a wallet).
 *
 * Verifying the signature alone is not enough: a compromised signer could return a valid signature
 * over data you never asked it to sign. From the `message` and `requiredSigners` you requested,
 * this function reconstructs the version 1 offchain message you expected, asserts that it matches
 * the bytes the signer reports having signed, then asserts that the signature is a valid Ed25519
 * signature of those bytes by the signer.
 *
 * Only version 1 offchain messages are supported, since that is the only version the
 * `solana:signOffchainMessage` wallet feature produces. The signer returns one signature per
 * signer, so call this once per signature you collect; `requiredSigners` defaults to `[signer]`.
 *
 * @throws A {@link SolanaError} with code
 * {@link SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE} if `signer` is not
 * one of the `requiredSigners`, {@link SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED}
 * if the signed bytes do not match the expected message, or
 * {@link SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE} if the signature is
 * invalid. It can also surface an error raised while encoding the expected message if `message` and
 * `requiredSigners` do not form a structurally valid offchain message.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import { isSolanaError, SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED } from '@solana/errors';
 * import { verifyOffchainMessage } from '@solana/offchain-messages';
 *
 * try {
 *     await verifyOffchainMessage({
 *         message,
 *         signature,
 *         signedMessageBytes: signedOffchainMessage,
 *         signer: address(account.address),
 *     });
 *     // The wallet signed exactly the message you expected, and the signature is valid.
 * } catch (e) {
 *     if (isSolanaError(e, SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED)) {
 *         // The signer signed something other than what you asked for.
 *     }
 *     throw e;
 * }
 * ```
 *
 * @see {@link verifyOffchainMessageEnvelope} if you instead hold an {@link OffchainMessageEnvelope}
 * and want to verify that it is signed by all of its required signatories.
 */
export async function verifyOffchainMessage({
    message,
    requiredSigners,
    signature,
    signedMessageBytes,
    signer,
}: VerifyOffchainMessageInput): Promise<void> {
    const resolvedRequiredSigners = requiredSigners ?? [signer];
    const expectedMessage: OffchainMessageV1 = {
        content: message,
        requiredSignatories: resolvedRequiredSigners.map(address => ({ address })),
        version: 1,
    };
    const expectedMessageBytes = getOffchainMessageV1Encoder().encode(expectedMessage);
    if (!resolvedRequiredSigners.includes(signer)) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE, {
            expectedAddresses: resolvedRequiredSigners,
            unexpectedAddresses: [signer],
        });
    }
    if (!bytesEqual(expectedMessageBytes, signedMessageBytes)) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED);
    }
    const publicKey = await getPublicKeyFromAddress(signer);
    if (!(await verifySignature(publicKey, signature, signedMessageBytes))) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE, {
            signatoriesWithInvalidSignatures: [signer],
            signatoriesWithMissingSignatures: [],
        });
    }
}
