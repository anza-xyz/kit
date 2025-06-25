import { SOLANA_ERROR__ADDRESSES__INVALID_SEEDS_POINT_ON_CURVE, SolanaError } from '@solana/errors';
import { type Address, getAddressCodec, isAddress } from './address';
import { compressedPointBytesAreOnCurve } from './curve-internal';

/**
 * A type guard that returns `true` if the input string conforms to the {@link Address} type, the input string is on
 * the ED25519 curve, and refines its type for use in your application.
 *
 * @example
 * ```ts
 * import { isAddressOnCurve } from '@solana/addresses';
 *
 * if (isAddressOnCurve(ownerAddress)) {
 *     // At this point, `ownerAddress` has been refined to a
 *     // `Address` that can be used with the RPC.
 *     const { value: lamports } = await rpc.getBalance(ownerAddress).send();
 *     setBalanceLamports(lamports);
 * } else {
 *     setError(`${ownerAddress} is not on-curve`);
 * }
 * ```
 */
export function isAddressOnCurve(putativeAddress: string): putativeAddress is Address<typeof putativeAddress> {
    if (!isAddress(putativeAddress)) return false;
    const base58EncodedAddressCodec = getAddressCodec();
    const addressBytes = new Uint8Array(base58EncodedAddressCodec.encode(putativeAddress));
    if (compressedPointBytesAreOnCurve(addressBytes)) return false;
    return true;
}

/**
 * From time to time you might acquire a string, that you expect to validate as an on-curve address,
 * from an untrusted network API or user input. Use this function to assert that such an
 * arbitrary string is a base58-encoded address that is on-curve.
 *
 * @example
 * ```ts
 * import { assertIsAddressOnCurve } from '@solana/addresses';
 *
 * // Imagine a function that fetches an account's balance when a user submits a form.
 * function handleSubmit() {
 *     // We know only that the input conforms to the `string` type.
 *     const address: string = accountAddressInput.value;
 *     try {
 *         // If this type assertion function doesn't throw, then
 *         // Typescript will upcast `address` to `Address`.
 *         assertIsAddressOnCurve(address);
 *         // At this point, `address` is an `Address` that can be used with the RPC.
 *         const balanceInLamports = await rpc.getBalance(address).send();
 *     } catch (e) {
 *         // `address` turned out to NOT be a base58-encoded on-curve address
 *     }
 * }
 * ```
 */
export function assertIsAddressOnCurve(
    putativeAddress: string,
): asserts putativeAddress is Address<typeof putativeAddress> {
    if (!isAddressOnCurve(putativeAddress)) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__INVALID_SEEDS_POINT_ON_CURVE);
    }
}

/**
 * From time to time you might acquire a string, that you expect to validate as an off-curve address,
 * from an untrusted network API or user input. Use this function to assert that such an
 * arbitrary string is a base58-encoded address that is off-curve.
 *
 * @example
 * ```ts
 * import { assertIsAddressOffCurve } from '@solana/addresses';
 *
 * // Imagine a function that fetches an account's balance when a user submits a form.
 * function handleSubmit() {
 *     // We know only that the input conforms to the `string` type.
 *     const address: string = accountAddressInput.value;
 *     try {
 *         // If this type assertion function doesn't throw, then
 *         // Typescript will upcast `address` to `Address`.
 *         assertIsAddressOffCurve(address);
 *         // At this point, `address` is an `Address` that can be used with the RPC.
 *         const balanceInLamports = await rpc.getBalance(address).send();
 *     } catch (e) {
 *         // `address` turned out to NOT be a base58-encoded off-curve address
 *     }
 * }
 * ```
 */
export function assertIsAddressOffCurve(
    putativeAddress: string,
): asserts putativeAddress is Address<typeof putativeAddress> {
    if (isAddressOnCurve(putativeAddress)) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__INVALID_SEEDS_POINT_ON_CURVE);
    }
}
