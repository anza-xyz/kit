import {
    type Account,
    assertAccountExists,
    assertAccountsExist,
    decodeAccount,
    type FetchAccountConfig,
    type FetchAccountsConfig,
    fetchEncodedAccount,
    fetchEncodedAccounts,
    type MaybeAccount,
} from '@solana/accounts';
import type { Address } from '@solana/addresses';
import type { Codec } from '@solana/codecs-core';
import type { ClientWithRpc } from '@solana/plugin-interfaces';
import type { GetAccountInfoApi, GetMultipleAccountsApi } from '@solana/rpc-api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObjectCodec = Codec<any, object>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InferTFrom<T> = T extends Codec<infer TFrom, any> ? TFrom : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InferTTo<T> = T extends Codec<any, infer TTo> ? TTo : never;

/**
 * Methods that allow a codec to fetch and decode accounts directly.
 *
 * These methods are added to codec objects via {@link addSelfFetchFunctions},
 * enabling a fluent API where you can call `.fetch()` directly on a codec
 * to retrieve and decode accounts in one step.
 *
 * @typeParam TFrom - The type that the codec encodes from.
 * @typeParam TTo - The type that the codec decodes to.
 *
 * @example
 * Fetching a single account and asserting it exists.
 * ```ts
 * const account = await myAccountCodec.fetch(address);
 * // account.data is of type TTo.
 * ```
 *
 * @example
 * Fetching a single account that may not exist.
 * ```ts
 * const maybeAccount = await myAccountCodec.fetchMaybe(address);
 * if (maybeAccount.exists) {
 *     // maybeAccount.data is of type TTo.
 * }
 * ```
 *
 * @example
 * Fetching multiple accounts at once.
 * ```ts
 * const accounts = await myAccountCodec.fetchAll([addressA, addressB]);
 * // All accounts exist.
 * ```
 *
 * @see {@link addSelfFetchFunctions}
 */
export type SelfFetchFunctions<TFrom extends object, TTo extends TFrom> = {
    /** Fetches and decodes a single account, throwing if it does not exist. */
    readonly fetch: <TAddress extends string>(
        address: Address<TAddress>,
        config?: FetchAccountConfig,
    ) => Promise<Account<TTo, TAddress>>;
    /** Fetches and decodes multiple accounts, throwing if any do not exist. */
    readonly fetchAll: (addresses: Address[], config?: FetchAccountsConfig) => Promise<Account<TTo>[]>;
    /** Fetches and decodes multiple accounts, returning {@link MaybeAccount} for each. */
    readonly fetchAllMaybe: (addresses: Address[], config?: FetchAccountsConfig) => Promise<MaybeAccount<TTo>[]>;
    /** Fetches and decodes a single account, returning a {@link MaybeAccount}. */
    readonly fetchMaybe: <TAddress extends string>(
        address: Address<TAddress>,
        config?: FetchAccountConfig,
    ) => Promise<MaybeAccount<TTo, TAddress>>;
};

/**
 * Adds self-fetching methods to a codec for retrieving and decoding accounts.
 *
 * This function augments the provided codec with methods that allow it to fetch
 * accounts from the network and decode them in one step. It enables a fluent API
 * where you can call methods like `.fetch()` directly on the codec.
 *
 * @typeParam TFrom - The type that the codec encodes from.
 * @typeParam TTo - The type that the codec decodes to.
 * @typeParam TCodec - The codec type being augmented.
 *
 * @param client - A client that provides RPC access for fetching accounts.
 * @param codec - The codec to augment with self-fetch methods.
 * @returns The codec augmented with {@link SelfFetchFunctions} methods.
 *
 * @example
 * Adding self-fetch functions to an account codec.
 * ```ts
 * import { addSelfFetchFunctions } from '@solana/program-client-core';
 *
 * const myAccountCodec = addSelfFetchFunctions(client, getMyAccountCodec());
 *
 * // Fetch and decode an account in one step.
 * const account = await myAccountCodec.fetch(accountAddress);
 * ```
 *
 * @example
 * Handling accounts that may not exist.
 * ```ts
 * const myAccountCodec = addSelfFetchFunctions(client, getMyAccountCodec());
 *
 * const maybeAccount = await myAccountCodec.fetchMaybe(accountAddress);
 * if (maybeAccount.exists) {
 *     console.log('Account data:', maybeAccount.data);
 * } else {
 *     console.log(`Account ${maybeAccount.address} does not exist`);
 * }
 * ```
 *
 * @example
 * Fetching multiple accounts at once.
 * ```ts
 * const myAccountCodec = addSelfFetchFunctions(client, getMyAccountCodec());
 *
 * // Throws if any account does not exist.
 * const accounts = await myAccountCodec.fetchAll([addressA, addressB, addressC]);
 *
 * // Returns MaybeAccount for each, allowing some to not exist.
 * const maybeAccounts = await myAccountCodec.fetchAllMaybe([addressA, addressB]);
 * ```
 *
 * @see {@link SelfFetchFunctions}
 */
export function addSelfFetchFunctions<TCodec extends AnyObjectCodec>(
    client: ClientWithRpc<GetAccountInfoApi & GetMultipleAccountsApi>,
    codec: TCodec,
): SelfFetchFunctions<InferTFrom<TCodec>, InferTTo<TCodec>> & TCodec {
    type Functions = SelfFetchFunctions<InferTFrom<TCodec>, InferTTo<TCodec>>;
    type InferredCodec = Codec<InferTFrom<TCodec>, InferTTo<TCodec>>;
    const fetchMaybe: Functions['fetchMaybe'] = async (address, config?) => {
        const maybeAccount = await fetchEncodedAccount(client.rpc, address, config);
        return decodeAccount(maybeAccount, codec as InferredCodec);
    };
    const fetchAllMaybe: Functions['fetchAllMaybe'] = async (addresses, config?) => {
        const maybeAccounts = await fetchEncodedAccounts(client.rpc, addresses, config);
        return maybeAccounts.map(maybeAccount => decodeAccount(maybeAccount, codec as InferredCodec));
    };
    const fetch: Functions['fetch'] = async (address, config?) => {
        const maybeAccount = await fetchMaybe(address, config);
        assertAccountExists(maybeAccount);
        return maybeAccount;
    };
    const fetchAll: Functions['fetchAll'] = async (addresses, config?) => {
        const maybeAccounts = await fetchAllMaybe(addresses, config);
        assertAccountsExist(maybeAccounts);
        return maybeAccounts;
    };

    const out = { ...codec, fetch, fetchAll, fetchAllMaybe, fetchMaybe };
    return Object.freeze<typeof out>(out);
}
