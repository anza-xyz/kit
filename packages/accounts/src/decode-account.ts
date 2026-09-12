import type { Decoder, ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__ACCOUNTS__EXPECTED_ALL_ACCOUNTS_TO_BE_DECODED,
    SOLANA_ERROR__ACCOUNTS__EXPECTED_DECODED_ACCOUNT,
    SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT,
    SolanaError,
} from '@solana/errors';

import type { Account, EncodedAccount } from './account';
import type { MaybeAccount, MaybeEncodedAccount } from './maybe-account';

/**
 * Transforms an {@link EncodedAccount} into an {@link Account} (or a {@link MaybeEncodedAccount}
 * into a {@link MaybeAccount}) by decoding the account data using the provided {@link Decoder}
 * instance.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TData - The type of this account's data.
 *
 * @example
 * ```ts
 * type MyAccountData = { name: string; age: number };
 *
 * const myAccount: EncodedAccount<'1234..5678'>;
 * const myDecoder: Decoder<MyAccountData> = getStructDecoder([
 *     ['name', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
 *     ['age', getU32Decoder()],
 * ]);
 *
 * const myDecodedAccount = decodeAccount(myAccount, myDecoder);
 * myDecodedAccount satisfies Account<MyAccountData, '1234..5678'>;
 * ```
 */
export function decodeAccount<TData extends object, TAddress extends string = string>(
    encodedAccount: EncodedAccount<TAddress>,
    decoder: Decoder<TData>,
): Account<TData, TAddress>;
export function decodeAccount<TData extends object, TAddress extends string = string>(
    encodedAccount: MaybeEncodedAccount<TAddress>,
    decoder: Decoder<TData>,
): MaybeAccount<TData, TAddress>;
export function decodeAccount<TData extends object, TAddress extends string = string>(
    encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>,
    decoder: Decoder<TData>,
): Account<TData, TAddress> | MaybeAccount<TData, TAddress> {
    try {
        if ('exists' in encodedAccount && !encodedAccount.exists) {
            return encodedAccount;
        }
        return Object.freeze({ ...encodedAccount, data: decoder.decode(encodedAccount.data) });
    } catch {
        throw new SolanaError(SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT, {
            address: encodedAccount.address,
        });
    }
}

function accountExists<TData extends object>(account: Account<TData> | MaybeAccount<TData>): account is Account<TData> {
    return !('exists' in account) || ('exists' in account && account.exists);
}

/**
 * Asserts that an account stores decoded data, ie. not a `Uint8Array`.
 *
 * Note that it does not check the shape of the data matches the decoded type, only that it is not a
 * `Uint8Array`.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TData - The type of this account's data.
 *
 * @example
 * ```ts
 * type MyAccountData = { name: string; age: number };
 *
 * const myAccount: Account<MyAccountData | Uint8Array, '1234..5678'>;
 * assertAccountDecoded(myAccount);
 *
 * // now the account data can be used as MyAccountData
 * account.data satisfies MyAccountData;
 * ```
 *
 * This is particularly useful for narrowing the result of fetching a JSON parsed account.
 *
 * ```ts
 * const account: MaybeAccount<MockData | Uint8Array> = await fetchJsonParsedAccount<MockData>(
 *     rpc,
 *     '1234..5678' as Address,
 * );
 *
 * assertAccountDecoded(account);
 * // now we have a MaybeAccount<MockData>
 * account satisfies MaybeAccount<MockData>;
 * ```
 */
export function assertAccountDecoded<TData extends object, TAddress extends string = string>(
    account: Account<TData | Uint8Array, TAddress>,
): asserts account is Account<TData, TAddress>;
export function assertAccountDecoded<TData extends object, TAddress extends string = string>(
    account: MaybeAccount<TData | Uint8Array, TAddress>,
): asserts account is MaybeAccount<TData, TAddress>;
export function assertAccountDecoded<TData extends object, TAddress extends string = string>(
    account: Account<TData | Uint8Array, TAddress> | MaybeAccount<TData | Uint8Array, TAddress>,
): asserts account is Account<TData, TAddress> | MaybeAccount<TData, TAddress> {
    if (accountExists(account) && account.data instanceof Uint8Array) {
        throw new SolanaError(SOLANA_ERROR__ACCOUNTS__EXPECTED_DECODED_ACCOUNT, {
            address: account.address,
        });
    }
}

type DecodedAccountData<TData> =
    Exclude<TData, ReadonlyUint8Array | Uint8Array> extends infer TDecoded
        ? TDecoded extends object
            ? TDecoded
            : never
        : never;

type AssertedDecodedAccount<TAccount> = [TAccount] extends [MaybeAccount<infer TData, infer TAddress>]
    ? [TAccount] extends [Account<ReadonlyUint8Array | object, string>]
        ? Account<DecodedAccountData<TData>, TAddress>
        : MaybeAccount<DecodedAccountData<TData>, TAddress>
    : [TAccount] extends [Account<infer TData, infer TAddress>]
      ? Account<DecodedAccountData<TData>, TAddress>
      : TAccount;

type AssertedDecodedAccounts<TAccounts extends readonly unknown[]> = {
    -readonly [P in keyof TAccounts]: AssertedDecodedAccount<TAccounts[P]>;
};

/**
 * Asserts that all input accounts store decoded data, ie. not a `Uint8Array`.
 *
 * As with {@link assertAccountDecoded} it does not check the shape of the data matches the decoded
 * type, only that it is not a `Uint8Array`.
 *
 * When called with a tuple of accounts, each element's address and decoded data type is preserved
 * instead of collapsing to a single shared type parameter.
 *
 * @typeParam TAccounts - The tuple or array of accounts to narrow. Each element's address and
 * decoded data type is preserved.
 *
 * @example
 * ```ts
 * type TokenData = { mint: Address };
 * type MintData = { supply: bigint };
 *
 * const myAccounts: [
 *     Account<TokenData | Uint8Array, '1111..'>,
 *     Account<MintData | Uint8Array, '2222..'>,
 * ] = [
 *     {} as Account<TokenData | Uint8Array, '1111..'>,
 *     {} as Account<MintData | Uint8Array, '2222..'>,
 * ];
 * assertAccountsDecoded(myAccounts);
 *
 * myAccounts[0] satisfies Account<TokenData, '1111..'>;
 * myAccounts[1] satisfies Account<MintData, '2222..'>;
 * ```
 */
export function assertAccountsDecoded<
    TAccounts extends readonly (
        | Account<ReadonlyUint8Array | object, string>
        | MaybeAccount<ReadonlyUint8Array | object, string>
    )[],
>(accounts: AssertedDecodedAccounts<TAccounts> | TAccounts): asserts accounts is AssertedDecodedAccounts<TAccounts> {
    const encoded = accounts.filter(a => accountExists(a) && a.data instanceof Uint8Array);
    if (encoded.length > 0) {
        const encodedAddresses = encoded.map(a => a.address);
        throw new SolanaError(SOLANA_ERROR__ACCOUNTS__EXPECTED_ALL_ACCOUNTS_TO_BE_DECODED, {
            addresses: encodedAddresses,
        });
    }
}
