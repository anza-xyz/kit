import { Address, getAddressFromPublicKey } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING,
    SolanaError,
} from '@solana/errors';
import { SignatureBytes, signBytes } from '@solana/keys';
import { NominalType } from '@solana/nominal-types';

import { OffchainMessageEnvelope } from './envelope';

/**
 * Represents an offchain message envelope that is signed by all of its required signers.
 */
export type FullySignedOffchainMessageEnvelope = NominalType<'offchainMessageEnvelopeSignedness', 'fullySigned'>;

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

    await Promise.all(
        keyPairs.map(async keyPair => {
            const address = await getAddressFromPublicKey(keyPair.publicKey);
            const existingSignature = offchainMessageEnvelope.signatures[address];

            // Check if the address is expected to sign the message
            if (existingSignature === undefined) {
                // address is not an expected signer for this message
                unexpectedSigners ||= new Set();
                unexpectedSigners.add(address);
                return;
            }

            // Return if there are any unexpected signers already since we won't be using signatures
            if (unexpectedSigners) {
                return;
            }

            const newSignature = await signBytes(keyPair.privateKey, offchainMessageEnvelope.content);

            if (existingSignature !== null && uint8ArraysEqual(newSignature, existingSignature)) {
                // already have the same signature set
                return;
            }

            newSignatures ||= {};
            newSignatures[address] = newSignature;
        }),
    );

    if (unexpectedSigners && unexpectedSigners.size > 0) {
        const expectedSigners = Object.keys(offchainMessageEnvelope.signatures);
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE, {
            expectedAddresses: expectedSigners,
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
 * @see {@link partiallySignOffchainMessage} if you want to sign the message without asserting that
 * the resulting message envelope is fully signed.
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

function uint8ArraysEqual(arr1: ReadonlyUint8Array, arr2: ReadonlyUint8Array) {
    return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}
