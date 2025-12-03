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

/**
 * Asserts that all input accounts store decoded data, ie. not a `Uint8Array`.
 *
 * As with {@link assertAccountDecoded} it does not check the shape of the data matches the decoded
 * type, only that it is not a `Uint8Array`.
 *
 * @example
 * ```ts
 * type MyAccountData = { name: string; age: number };
 *
 * const myAccounts: Account<MyAccountData | Uint8Array, Address>[];
 * assertAccountsDecoded(myAccounts);
 *
 * // now the account data can be used as MyAccountData
 * for (const a of account) {
 *     account.data satisfies MyAccountData;
 * }
 * ```
 */
export function assertAccountsDecoded<TData extends object, TAddress extends string = string>(
    accounts: Account<ReadonlyUint8Array | TData, TAddress>[],
): asserts accounts is Account<TData, TAddress>[];
export function assertAccountsDecoded<TData extends object, TAddress extends string = string>(
    accounts: MaybeAccount<ReadonlyUint8Array | TData, TAddress>[],
): asserts accounts is MaybeAccount<TData, TAddress>[];
export function assertAccountsDecoded<TData extends object, TAddress extends string = string>(
    accounts: (Account<ReadonlyUint8Array | TData, TAddress> | MaybeAccount<ReadonlyUint8Array | TData, TAddress>)[],
): asserts accounts is (Account<TData, TAddress> | MaybeAccount<TData, TAddress>)[] {
    const encoded = accounts.filter(a => accountExists(a) && a.data instanceof Uint8Array);
    if (encoded.length > 0) {
        const encodedAddresses = encoded.map(a => a.address);
        throw new SolanaError(SOLANA_ERROR__ACCOUNTS__EXPECTED_ALL_ACCOUNTS_TO_BE_DECODED, {
            addresses: encodedAddresses,
        });
    }
}
