import { SOLANA_ERROR__ADDRESSES__INVALID_OFF_CURVE_ADDRESS, SolanaError } from '@solana/errors';
import type { AffinePoint } from '@solana/nominal-types';

import { type Address, getAddressCodec, isAddress } from './address';
import { compressedPointBytesAreOnCurve } from './curve-internal';

/**
 * Represents a string that validates as an off-curve Solana address. Functions that require well-formed
 * off-curve addresses should specify their inputs in terms of this type.
 *
 * Whenever you need to validate an arbitrary string as a base58-encoded off-curve address, use the
 * {@link offCurveAddress}, {@link assertIsOffCurveAddress}, or {@link isOffCurveAddress} functions in this package.
 */
export type OffCurveAddress<TAddress extends string = string> = AffinePoint<Address<TAddress>, 'invalid'>;

/**
 * A type guard that returns `true` if the input string conforms to the {@link OffCurveAddress} type,
 * and refines its type for use in your application.
 *
 * @example
 * ```ts
 * import { isOffCurveAddress } from '@solana/addresses';
 *
 * if (isOffCurveAddress(accountAddress)) {
 *     // At this point, `accountAddress` has been refined to a
 *     // `OffCurveAddress` that can be used within your business logic.
 *     const { value: account } = await rpc.getAccountInfo(accountAddress).send();
 * } else {
 *     setError(`${accountAddress} is not off-curve`);
 * }
 * ```
 */
export function isOffCurveAddress(
    putativeOffCurveAddress: string,
): putativeOffCurveAddress is OffCurveAddress<typeof putativeOffCurveAddress> {
    if (!isAddress(putativeOffCurveAddress)) {
        return false;
    }
    const addressBytes = new Uint8Array(getAddressCodec().encode(putativeOffCurveAddress));
    return compressedPointBytesAreOnCurve(addressBytes);
}

/**
 * From time to time you might acquire a string, that you expect to validate as an off-curve address,
 * from an untrusted network API or user input. Use this function to assert that such an
 * arbitrary string is a base58-encoded address that is off-curve.
 *
 * @example
 * ```ts
 * import { assertIsOffCurveAddress } from '@solana/addresses';
 *
 * // Imagine a function that fetches an account's balance when a user submits a form.
 * function handleSubmit() {
 *     // We know only that the input conforms to the `string` type.
 *     const address: string = accountAddressInput.value;
 *     try {
 *         // If this type assertion function doesn't throw, then
 *         // Typescript will upcast `address` to `Address`.
 *         assertIsOffCurveAddress(address);
 *         // At this point, `address` is an `Address` that can be used with the RPC.
 *         const balanceInLamports = await rpc.getBalance(address).send();
 *     } catch (e) {
 *         // `address` turned out to NOT be a base58-encoded off-curve address
 *     }
 * }
 * ```
 */
export function assertIsOffCurveAddress(
    putativeOffCurveAddress: string,
): asserts putativeOffCurveAddress is OffCurveAddress<typeof putativeOffCurveAddress> {
    if (!isOffCurveAddress(putativeOffCurveAddress)) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__INVALID_OFF_CURVE_ADDRESS);
    }
}

/**
 * Combines _asserting_ that a string is an off-curve address with _coercing_ it to the
 * {@link OffCurveAddress} type. It's most useful with untrusted input.
 */
export function offCurveAddress<TAddress extends string = string>(
    putativeOffCurveAddress: TAddress,
): OffCurveAddress<TAddress> {
    assertIsOffCurveAddress(putativeOffCurveAddress);
    return putativeOffCurveAddress as OffCurveAddress<TAddress>;
}
