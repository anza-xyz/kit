import { assertSigningCapabilityIsAvailable, assertVerificationCapabilityIsAvailable } from '@solana/assertions';
import { Encoder, ReadonlyUint8Array } from '@solana/codecs-core';
import { getBase58Encoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__KEYS__INVALID_SIGNATURE_BYTE_LENGTH,
    SOLANA_ERROR__KEYS__SIGNATURE_STRING_LENGTH_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';
import { Brand, EncodedString } from '@solana/nominal-types';

import { ED25519_ALGORITHM_IDENTIFIER } from './algorithm';

/**
 * A 64-byte Ed25519 signature as a base58-encoded string.
 */
export type Signature = Brand<EncodedString<string, 'base58'>, 'Signature'>;
/**
 * A 64-byte Ed25519 signature.
 *
 * Whenever you need to verify that a particular signature is, in fact, the one that would have been
 * produced by signing some known bytes using the private key associated with some known public key,
 * use the {@link verifySignature} function in this package.
 */
export type SignatureBytes = Brand<Uint8Array, 'SignatureBytes'>;

let base58Encoder: Encoder<string> | undefined;

/**
 * Asserts that an arbitrary string is a base58-encoded Ed25519 signature.
 *
 * Useful when you receive a string from user input or an untrusted network API that you expect to
 * represent an Ed25519 signature (eg. of a transaction).
 *
 * @example
 * ```ts
 * import { assertIsSignature } from '@solana/keys';
 *
 * // Imagine a function that asserts whether a user-supplied signature is valid or not.
 * function handleSubmit() {
 *     // We know only that what the user typed conforms to the `string` type.
 *     const signature: string = signatureInput.value;
 *     try {
 *         // If this type assertion function doesn't throw, then
 *         // Typescript will upcast `signature` to `Signature`.
 *         assertIsSignature(signature);
 *         // At this point, `signature` is a `Signature` that can be used with the RPC.
 *         const {
 *             value: [status],
 *         } = await rpc.getSignatureStatuses([signature]).send();
 *     } catch (e) {
 *         // `signature` turned out not to be a base58-encoded signature
 *     }
 * }
 * ```
 */
export function assertIsSignature(putativeSignature: string): asserts putativeSignature is Signature {
    if (!base58Encoder) base58Encoder = getBase58Encoder();
    // Fast-path; see if the input string is of an acceptable length.
    if (
        // Lowest value (64 bytes of zeroes)
        putativeSignature.length < 64 ||
        // Highest value (64 bytes of 255)
        putativeSignature.length > 88
    ) {
        throw new SolanaError(SOLANA_ERROR__KEYS__SIGNATURE_STRING_LENGTH_OUT_OF_RANGE, {
            actualLength: putativeSignature.length,
        });
    }
    // Slow-path; actually attempt to decode the input string.
    const bytes = base58Encoder.encode(putativeSignature);
    const numBytes = bytes.byteLength;
    if (numBytes !== 64) {
        throw new SolanaError(SOLANA_ERROR__KEYS__INVALID_SIGNATURE_BYTE_LENGTH, {
            actualLength: numBytes,
        });
    }
}

/**
 * A type guard that accepts a string as input. It will both return `true` if the string conforms to
 * the {@link Signature} type and will refine the type for use in your program.
 *
 * @example
 * ```ts
 * import { isSignature } from '@solana/keys';
 *
 * if (isSignature(signature)) {
 *     // At this point, `signature` has been refined to a
 *     // `Signature` that can be used with the RPC.
 *     const {
 *         value: [status],
 *     } = await rpc.getSignatureStatuses([signature]).send();
 *     setSignatureStatus(status);
 * } else {
 *     setError(`${signature} is not a transaction signature`);
 * }
 * ```
 */
export function isSignature(putativeSignature: string): putativeSignature is Signature {
    if (!base58Encoder) base58Encoder = getBase58Encoder();

    // Fast-path; see if the input string is of an acceptable length.
    if (
        // Lowest value (64 bytes of zeroes)
        putativeSignature.length < 64 ||
        // Highest value (64 bytes of 255)
        putativeSignature.length > 88
    ) {
        return false;
    }
    // Slow-path; actually attempt to decode the input string.
    const bytes = base58Encoder.encode(putativeSignature);
    const numBytes = bytes.byteLength;
    if (numBytes !== 64) {
        return false;
    }
    return true;
}

/**
 * Given a private [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey) and a
 * `Uint8Array` of bytes, this method will return the 64-byte Ed25519 signature of that data as a
 * `Uint8Array`.
 *
 * @example
 * ```ts
 * import { signBytes } from '@solana/keys';
 *
 * const data = new Uint8Array([1, 2, 3]);
 * const signature = await signBytes(privateKey, data);
 * ```
 */
export async function signBytes(key: CryptoKey, data: ReadonlyUint8Array): Promise<SignatureBytes> {
    assertSigningCapabilityIsAvailable();
    const signedData = await crypto.subtle.sign(ED25519_ALGORITHM_IDENTIFIER, key, data);
    return new Uint8Array(signedData) as SignatureBytes;
}

/**
 * This helper combines _asserting_ that a string is an Ed25519 signature with _coercing_ it to the
 * {@link Signature} type. It's best used with untrusted input.
 *
 * @example
 * ```ts
 * import { signature } from '@solana/keys';
 *
 * const signature = signature(userSuppliedSignature);
 * const {
 *     value: [status],
 * } = await rpc.getSignatureStatuses([signature]).send();
 * ```
 */
export function signature(putativeSignature: string): Signature {
    assertIsSignature(putativeSignature);
    return putativeSignature;
}

/**
 * Given a public [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey), some
 * {@link SignatureBytes}, and a `Uint8Array` of data, this method will return `true` if the
 * signature was produced by signing the data using the private key associated with the public key,
 * and `false` otherwise.
 *
 * @example
 * ```ts
 * import { verifySignature } from '@solana/keys';
 *
 * const data = new Uint8Array([1, 2, 3]);
 * if (!(await verifySignature(publicKey, signature, data))) {
 *     throw new Error('The data were *not* signed by the private key associated with `publicKey`');
 * }
 * ```
 */
export async function verifySignature(
    key: CryptoKey,
    signature: SignatureBytes,
    data: ReadonlyUint8Array,
): Promise<boolean> {
    assertVerificationCapabilityIsAvailable();
    return await crypto.subtle.verify(ED25519_ALGORITHM_IDENTIFIER, key, signature, data);
}
