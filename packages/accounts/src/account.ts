import type { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import type { Lamports } from '@solana/rpc-types';

/**
 * The number of bytes required to store the {@link BaseAccount} information without its data.
 *
 * @example
 * ```ts
 * const myTotalAccountSize = myAccountDataSize + BASE_ACCOUNT_SIZE;
 * ```
 */
export const BASE_ACCOUNT_SIZE = 128;

/**
 * Defines the attributes common to all Solana accounts. Namely, it contains everything stored
 * on-chain except the account data itself.
 *
 * @interface
 *
 * @example
 * ```ts
 * const BaseAccount: BaseAccount = {
 *     executable: false,
 *     lamports: lamports(1_000_000_000n),
 *     programAddress: address('1111..1111'),
 *     space: 42n,
 * };
 * ```
 */
export type BaseAccount = {
    readonly executable: boolean;
    readonly lamports: Lamports;
    readonly programAddress: Address;
    readonly space: bigint;
};

/**
 * Contains all the information relevant to a Solana account. It includes the account's address and
 * data, as well as the properties of {@link BaseAccount}.
 *
 * @interface
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TData - The nature of this account's data. It can be represented as either a
 * `Uint8Array` &ndash; meaning the account is encoded &ndash; or a custom data type &ndash; meaning
 * the account is decoded.
 *
 * @example
 * ```ts
 * // Encoded
 * const myEncodedAccount: Account<Uint8Array, '1234..5678'> = {
 *     address: address('1234..5678'),
 *     data: new Uint8Array([1, 2, 3]),
 *     executable: false,
 *     lamports: lamports(1_000_000_000n),
 *     programAddress: address('1111..1111'),
 *     space: 42n,
 * };
 *
 * // Decoded
 * type MyAccountData = { name: string; age: number };
 * const myDecodedAccount: Account<MyAccountData, '1234..5678'> = {
 *     address: address('1234..5678'),
 *     data: { name: 'Alice', age: 30 },
 *     executable: false,
 *     lamports: lamports(1_000_000_000n),
 *     programAddress: address('1111..1111'),
 *     space: 42n,
 * };
 * ```
 */
export type Account<TData extends Uint8Array | object, TAddress extends string = string> = BaseAccount & {
    readonly address: Address<TAddress>;
    readonly data: TData;
};

/**
 * Represents an encoded account and is equivalent to an {@link Account} with `Uint8Array` account
 * data.
 *
 * @interface
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 *
 * @example
 * ```ts
 * {
 *     address: address('1234..5678'),
 *     data: new Uint8Array([1, 2, 3]),
 *     executable: false,
 *     lamports: lamports(1_000_000_000n),
 *     programAddress: address('1111..1111'),
 *     space: 42n,
 * } satisfies EncodedAccount<'1234..5678'>;
 * ```
 */
export type EncodedAccount<TAddress extends string = string> = Account<ReadonlyUint8Array, TAddress>;
