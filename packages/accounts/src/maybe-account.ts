import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND,
    SOLANA_ERROR__ACCOUNTS__ONE_OR_MORE_ACCOUNTS_NOT_FOUND,
    SolanaError,
} from '@solana/errors';

import { Account } from './account';

/**
 * Represents an account that may or may not exist on-chain.
 *
 * When the account exists, it is represented as an {@link Account} type with an additional `exists`
 * attribute set to `true`. When it does not exist, it is represented by an object containing only
 * the address of the account and an `exists` attribute set to `false`.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TData - The nature of this account's data. It can be represented as either a
 * `Uint8Array` &ndash; meaning the account is encoded &ndash; or a custom data type &ndash; meaning
 * the account is decoded.
 *
 * @example
 * ```ts
 * // Account exists
 * const myExistingAccount: MaybeAccount<MyAccountData, '1234..5678'> = {
 *     exists: true,
 *     address: address('1234..5678'),
 *     data: { name: 'Alice', age: 30 },
 *     // ...
 * };
 *
 * // Account does not exist
 * const myMissingAccount: MaybeAccount<MyAccountData, '8765..4321'> = {
 *     exists: false,
 *     address: address('8765..4321'),
 * };
 * ```
 */
export type MaybeAccount<TData extends Uint8Array | object, TAddress extends string = string> =
    | { readonly address: Address<TAddress>; readonly exists: false }
    | (Account<TData, TAddress> & { readonly exists: true });

/**
 * Represents an encoded account that may or may not exist on-chain.
 *
 * When the account exists, it is represented as an {@link Account} type having its `TData` type
 * parameter set to `Uint8Array` with an additional `exists` attribute set to `true`. When it does
 * not exist, it is represented by an object containing only the address of the account and an
 * `exists` attribute set to `false`.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 *
 * @example
 * ```ts
 * // Encoded account exists
 * const myExistingAccount: MaybeEncodedAccount<'1234..5678'> = {
 *     exists: true,
 *     address: address('1234..5678'),
 *     data: new Uint8Array([1, 2, 3]),
 *     // ...
 * };
 *
 * // Encoded account does not exist
 * const myMissingAccount: MaybeEncodedAccount<'8765..4321'> = {
 *     exists: false,
 *     address: address('8765..4321'),
 * };
 * ```
 */
export type MaybeEncodedAccount<TAddress extends string = string> = MaybeAccount<Uint8Array, TAddress>;

/**
 * Given a {@link MaybeAccount}, asserts that the account exists and allows it to be used as an
 * {@link Account} type going forward.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TData - The nature of this account's data. It can be represented as either a
 * `Uint8Array` &ndash; meaning the account is encoded &ndash; or a custom data type &ndash; meaning
 * the account is decoded.
 *
 * @example
 * ```ts
 * const myAccount: MaybeEncodedAccount<'1234..5678'>;
 * assertAccountExists(myAccount);
 *
 * // Now we can use myAccount as an `EncodedAccount`
 * myAccount satisfies EncodedAccount<'1234..5678'>;
 * ```
 */
export function assertAccountExists<TData extends Uint8Array | object, TAddress extends string = string>(
    account: MaybeAccount<TData, TAddress>,
): asserts account is Account<TData, TAddress> & { exists: true } {
    if (!account.exists) {
        throw new SolanaError(SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, { address: account.address });
    }
}

/**
 * Given an array of {@link MaybeAccount | MaybeAccounts}, asserts that all the accounts exist and
 * allows them to be used as an array of {@link Account | Accounts} going forward.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TData - The nature of this account's data. It can be represented as either a
 * `Uint8Array` &ndash; meaning the account is encoded &ndash; or a custom data type &ndash; meaning
 * the account is decoded.
 *
 * @example
 * ```ts
 * const myAccounts: MaybeEncodedAccount<Address>[];
 * assertAccountsExist(myAccounts);
 *
 * // Now we can use them as an array of `EncodedAccounts`
 * for (const a of myAccounts) {
 *     a satisfies EncodedAccount<Address>;
 * }
 * ```
 */
export function assertAccountsExist<TData extends Uint8Array | object, TAddress extends string = string>(
    accounts: MaybeAccount<TData, TAddress>[],
): asserts accounts is (Account<TData, TAddress> & { exists: true })[] {
    const missingAccounts = accounts.filter(a => !a.exists);
    if (missingAccounts.length > 0) {
        const missingAddresses = missingAccounts.map(a => a.address);
        throw new SolanaError(SOLANA_ERROR__ACCOUNTS__ONE_OR_MORE_ACCOUNTS_NOT_FOUND, { addresses: missingAddresses });
    }
}
