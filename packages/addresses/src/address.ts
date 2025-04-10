import {
    combineCodec,
    Decoder,
    Encoder,
    fixDecoderSize,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    fixEncoderSize,
    transformEncoder,
} from '@solana/codecs-core';
import { getBase58Decoder, getBase58Encoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__ADDRESSES__INVALID_BYTE_LENGTH,
    SOLANA_ERROR__ADDRESSES__STRING_LENGTH_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

/**
 * Represents a string that validates as a Solana address. Functions that require well-formed
 * addresses should specify their inputs in terms of this type.
 *
 * Whenever you need to validate an arbitrary string as a base58-encoded address, use the
 * {@link address}, {@link assertIsAddress}, or {@link isAddress} functions in this package.
 */
export type Address<TAddress extends string = string> = TAddress & {
    readonly __brand: unique symbol;
};

let memoizedBase58Encoder: Encoder<string> | undefined;
let memoizedBase58Decoder: Decoder<string> | undefined;

function getMemoizedBase58Encoder(): Encoder<string> {
    if (!memoizedBase58Encoder) memoizedBase58Encoder = getBase58Encoder();
    return memoizedBase58Encoder;
}

function getMemoizedBase58Decoder(): Decoder<string> {
    if (!memoizedBase58Decoder) memoizedBase58Decoder = getBase58Decoder();
    return memoizedBase58Decoder;
}

/**
 * A type guard that returns `true` if the input string conforms to the {@link Address} type, and
 * refines its type for use in your program.
 *
 * @example
 * ```ts
 * import { isAddress } from '@solana/addresses';
 *
 * if (isAddress(ownerAddress)) {
 *     // At this point, `ownerAddress` has been refined to a
 *     // `Address` that can be used with the RPC.
 *     const { value: lamports } = await rpc.getBalance(ownerAddress).send();
 *     setBalanceLamports(lamports);
 * } else {
 *     setError(`${ownerAddress} is not an address`);
 * }
 * ```
 */
export function isAddress(putativeAddress: string): putativeAddress is Address<typeof putativeAddress> {
    // Fast-path; see if the input string is of an acceptable length.
    if (
        // Lowest address (32 bytes of zeroes)
        putativeAddress.length < 32 ||
        // Highest address (32 bytes of 255)
        putativeAddress.length > 44
    ) {
        return false;
    }
    // Slow-path; actually attempt to decode the input string.
    const base58Encoder = getMemoizedBase58Encoder();
    try {
        return base58Encoder.encode(putativeAddress).byteLength === 32;
    } catch {
        return false;
    }
}

/**
 * From time to time you might acquire a string, that you expect to validate as an address or public
 * key, from an untrusted network API or user input. Use this function to assert that such an
 * arbitrary string is a base58-encoded address.
 *
 * @example
 * ```ts
 * import { assertIsAddress } from '@solana/addresses';
 *
 * // Imagine a function that fetches an account's balance when a user submits a form.
 * function handleSubmit() {
 *     // We know only that what the user typed conforms to the `string` type.
 *     const address: string = accountAddressInput.value;
 *     try {
 *         // If this type assertion function doesn't throw, then
 *         // Typescript will upcast `address` to `Address`.
 *         assertIsAddress(address);
 *         // At this point, `address` is an `Address` that can be used with the RPC.
 *         const balanceInLamports = await rpc.getBalance(address).send();
 *     } catch (e) {
 *         // `address` turned out not to be a base58-encoded address
 *     }
 * }
 * ```
 */
export function assertIsAddress(putativeAddress: string): asserts putativeAddress is Address<typeof putativeAddress> {
    // Fast-path; see if the input string is of an acceptable length.
    if (
        // Lowest address (32 bytes of zeroes)
        putativeAddress.length < 32 ||
        // Highest address (32 bytes of 255)
        putativeAddress.length > 44
    ) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__STRING_LENGTH_OUT_OF_RANGE, {
            actualLength: putativeAddress.length,
        });
    }
    // Slow-path; actually attempt to decode the input string.
    const base58Encoder = getMemoizedBase58Encoder();
    const bytes = base58Encoder.encode(putativeAddress);
    const numBytes = bytes.byteLength;
    if (numBytes !== 32) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__INVALID_BYTE_LENGTH, {
            actualLength: numBytes,
        });
    }
}

/**
 * Combines _asserting_ that a string is an address with _coercing_ it to the {@link Address} type.
 * It's most useful with untrusted input.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 *
 * await transfer(address(fromAddress), address(toAddress), lamports(100000n));
 * ```
 *
 * > [!TIP]
 * > When starting from a known-good address as a string, it's more efficient to typecast it rather
 * than to use the {@link address} helper, because the helper unconditionally performs validation on
 * its input.
 * >
 * > ```ts
 * > import { Address } from '@solana/addresses';
 * >
 * > const MEMO_PROGRAM_ADDRESS =
 * >     'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr' as Address<'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'>;
 * > ```
 */
export function address<TAddress extends string = string>(putativeAddress: TAddress): Address<TAddress> {
    assertIsAddress(putativeAddress);
    return putativeAddress as Address<TAddress>;
}

/**
 * Returns an encoder that you can use to encode a base58-encoded address to a byte array.
 *
 * @example
 * ```ts
 * import { getAddressEncoder } from '@solana/addresses';
 *
 * const address = 'B9Lf9z5BfNPT4d5KMeaBFx8x1G4CULZYR1jA2kmxRDka' as Address;
 * const addressEncoder = getAddressEncoder();
 * const addressBytes = addressEncoder.encode(address);
 * // Uint8Array(32) [
 * //   150, 183, 190,  48, 171,   8, 39, 156,
 * //   122, 213, 172, 108, 193,  95, 26, 158,
 * //   149, 243, 115, 254,  20, 200, 36,  30,
 * //   248, 179, 178, 232, 220,  89, 53, 127
 * // ]
 * ```
 */
export function getAddressEncoder(): FixedSizeEncoder<Address, 32> {
    return transformEncoder(fixEncoderSize(getMemoizedBase58Encoder(), 32), putativeAddress =>
        address(putativeAddress),
    );
}

/**
 * Returns a decoder that you can use to convert an array of 32 bytes representing an address to the
 * base58-encoded representation of that address.
 *
 * @example
 * ```ts
 * import { getAddressDecoder } from '@solana/addresses';
 *
 * const addressBytes = new Uint8Array([
 *     150, 183, 190,  48, 171,   8, 39, 156,
 *     122, 213, 172, 108, 193,  95, 26, 158,
 *     149, 243, 115, 254,  20, 200, 36,  30,
 *     248, 179, 178, 232, 220,  89, 53, 127
 * ]);
 * const addressDecoder = getAddressDecoder();
 * const address = addressDecoder.decode(addressBytes); // B9Lf9z5BfNPT4d5KMeaBFx8x1G4CULZYR1jA2kmxRDka
 * ```
 */
export function getAddressDecoder(): FixedSizeDecoder<Address, 32> {
    return fixDecoderSize(getMemoizedBase58Decoder(), 32) as FixedSizeDecoder<Address, 32>;
}

/**
 * Returns a codec that you can use to encode from or decode to a base-58 encoded address.
 *
 * @see {@link getAddressDecoder}
 * @see {@link getAddressEncoder}
 */
export function getAddressCodec(): FixedSizeCodec<Address, Address, 32> {
    return combineCodec(getAddressEncoder(), getAddressDecoder());
}

export function getAddressComparator(): (x: string, y: string) => number {
    return new Intl.Collator('en', {
        caseFirst: 'lower',
        ignorePunctuation: false,
        localeMatcher: 'best fit',
        numeric: false,
        sensitivity: 'variant',
        usage: 'sort',
    }).compare;
}
