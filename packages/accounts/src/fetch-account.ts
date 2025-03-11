import type { Address } from '@solana/addresses';
import type { Rpc } from '@solana/rpc-spec';
import type { Commitment, Slot } from '@solana/rpc-types';

import type { MaybeAccount, MaybeEncodedAccount } from './maybe-account';
import { parseBase64RpcAccount, parseJsonRpcAccount } from './parse-account';
import type { GetAccountInfoApi, GetMultipleAccountsApi } from './rpc-api';

/**
 * Optional configuration for fetching a singular account.
 *
 * @interface
 */
export type FetchAccountConfig = {
    abortSignal?: AbortSignal;
    /**
     * Fetch the details of the account as of the highest slot that has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    minContextSlot?: Slot;
};

/**
 * Fetches a {@link MaybeEncodedAccount} from the provided RPC client and address.
 *
 * It uses the {@link GetAccountInfoApi.getAccountInfo | getAccountInfo} RPC method under the hood
 * with base64 encoding and an additional configuration object can be provided to customize the
 * behavior of the RPC call.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 *
 * @example
 * ```ts
 * const myAddress = address('1234..5678');
 * const myAccount: MaybeEncodedAccount<'1234..5678'> = await fetchEncodedAccount(rpc, myAddress);
 *
 * // With custom configuration.
 * const myAccount: MaybeEncodedAccount<'1234..5678'> = await fetchEncodedAccount(rpc, myAddress, {
 *     abortSignal: myAbortController.signal,
 *     commitment: 'confirmed',
 * });
 * ```
 */
export async function fetchEncodedAccount<TAddress extends string = string>(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address<TAddress>,
    config: FetchAccountConfig = {},
): Promise<MaybeEncodedAccount<TAddress>> {
    const { abortSignal, ...rpcConfig } = config;
    const response = await rpc.getAccountInfo(address, { ...rpcConfig, encoding: 'base64' }).send({ abortSignal });
    return parseBase64RpcAccount(address, response.value);
}

/**
 * Fetches a {@link MaybeAccount} from the provided RPC client and address by using
 * {@link GetAccountInfoApi.getAccountInfo | getAccountInfo} under the hood with the `jsonParsed`
 * encoding.
 *
 * It may also return a {@link MaybeEncodedAccount} if the RPC client does not know how to parse the
 * account at the requested address. In any case, the expected data type should be explicitly
 * provided as the first type parameter.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TData - The expected type of this account's data.
 *
 * @example
 * ```ts
 * type TokenData = { mint: Address; owner: Address };
 * const myAccount = await fetchJsonParsedAccount<TokenData>(rpc, myAddress);
 * myAccount satisfies MaybeAccount<TokenData> | MaybeEncodedAccount;
 *
 * // With custom configuration.
 * const myAccount = await fetchJsonParsedAccount<TokenData>(rpc, myAddress, {
 *     abortSignal: myAbortController.signal,
 *     commitment: 'confirmed',
 * });
 * ```
 */
export async function fetchJsonParsedAccount<TData extends object, TAddress extends string = string>(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address<TAddress>,
    config: FetchAccountConfig = {},
): Promise<MaybeAccount<TData, TAddress> | MaybeEncodedAccount<TAddress>> {
    const { abortSignal, ...rpcConfig } = config;
    const { value: account } = await rpc
        .getAccountInfo(address, { ...rpcConfig, encoding: 'jsonParsed' })
        .send({ abortSignal });
    return !!account && typeof account === 'object' && 'parsed' in account.data
        ? parseJsonRpcAccount<TData, TAddress>(address, account as Parameters<typeof parseJsonRpcAccount>[1])
        : parseBase64RpcAccount<TAddress>(address, account as Parameters<typeof parseBase64RpcAccount>[1]);
}

/**
 * Optional configuration for fetching multiple accounts.
 *
 * @interface
 */
export type FetchAccountsConfig = {
    abortSignal?: AbortSignal;
    /**
     * Fetch the details of the accounts as of the highest slot that has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    minContextSlot?: Slot;
};

/**
 * Fetches an array of {@link MaybeEncodedAccount | MaybeEncodedAccounts} from the provided RPC
 * client and an array of addresses.
 *
 * It uses the {@link GetMultipleAccountsApi#getMultipleAccounts | getMultipleAccounts} RPC method
 * under the hood with base64 encodings and an additional configuration object can be provided to
 * customize the behavior of the RPC call.
 *
 * @typeParam TAddresses - Supply an array of string literals to define accounts having particular
 * addresses.
 *
 * @example
 * ```ts
 * const myAddressA = address('1234..5678');
 * const myAddressB = address('8765..4321');
 * const [myAccountA, myAccountB] = await fetchEncodedAccounts(rpc, [myAddressA, myAddressB]);
 * myAccountA satisfies MaybeEncodedAccount<'1234..5678'>;
 * myAccountB satisfies MaybeEncodedAccount<'8765..4321'>;
 *
 * // With custom configuration.
 * const [myAccountA, myAccountB] = await fetchEncodedAccounts(rpc, [myAddressA, myAddressB], {
 *     abortSignal: myAbortController.signal,
 *     commitment: 'confirmed',
 * });
 * ```
 */
export async function fetchEncodedAccounts<
    TAddresses extends string[] = string[],
    TWrappedAddresses extends { [P in keyof TAddresses]: Address<TAddresses[P]> } = {
        [P in keyof TAddresses]: Address<TAddresses[P]>;
    },
>(rpc: Rpc<GetMultipleAccountsApi>, addresses: TWrappedAddresses, config: FetchAccountsConfig = {}) {
    const { abortSignal, ...rpcConfig } = config;
    const response = await rpc
        .getMultipleAccounts(addresses, { ...rpcConfig, encoding: 'base64' })
        .send({ abortSignal });
    return response.value.map((account, index) => parseBase64RpcAccount(addresses[index], account)) as {
        [P in keyof TAddresses]: MaybeEncodedAccount<TAddresses[P]>;
    };
}

/**
 * Fetches an array of {@link MaybeAccount | MaybeAccounts} from a provided RPC client and an array
 * of addresses.
 *
 * It uses the {@link GetMultipleAccountsApi#getMultipleAccounts | getMultipleAccounts} RPC method
 * under the hood with the `jsonParsed` encoding. It may also return a
 * {@link MaybeEncodedAccount} instead of the expected {@link MaybeAccount} if the RPC client does
 * not know how to parse some of the requested accounts. In any case, the array of expected data
 * types should be explicitly provided as the first type parameter.
 *
 * @typeParam TAddresses - Supply an array of string literals to define accounts having particular
 * addresses.
 * @typeParam TData - The expected types of these accounts' data.
 
 * @example
 * ```ts
 * type TokenData = { mint: Address; owner: Address };
 * type MintData = { supply: bigint };
 * const [myAccountA, myAccountB] = await fetchJsonParsedAccounts<[TokenData, MintData]>(rpc, [myAddressA, myAddressB]);
 * myAccountA satisfies MaybeAccount<TokenData> | MaybeEncodedAccount;
 * myAccountB satisfies MaybeAccount<MintData> | MaybeEncodedAccount;
 * ```
 */
export async function fetchJsonParsedAccounts<
    TData extends object[],
    TAddresses extends string[] = string[],
    TWrappedAddresses extends { [P in keyof TAddresses]: Address<TAddresses[P]> } = {
        [P in keyof TAddresses]: Address<TAddresses[P]>;
    },
>(rpc: Rpc<GetMultipleAccountsApi>, addresses: TWrappedAddresses, config: FetchAccountsConfig = {}) {
    const { abortSignal, ...rpcConfig } = config;
    const response = await rpc
        .getMultipleAccounts(addresses, { ...rpcConfig, encoding: 'jsonParsed' })
        .send({ abortSignal });
    return response.value.map((account, index) => {
        return !!account && typeof account === 'object' && 'parsed' in account.data
            ? parseJsonRpcAccount(addresses[index], account as Parameters<typeof parseJsonRpcAccount>[1])
            : parseBase64RpcAccount(addresses[index], account as Parameters<typeof parseBase64RpcAccount>[1]);
    }) as {
        [P in keyof TAddresses]:
            | MaybeAccount<TData[P & keyof TData], TAddresses[P]>
            | MaybeEncodedAccount<TAddresses[P]>;
    } & {
        [P in keyof TData]:
            | MaybeAccount<TData[P], TAddresses[P & keyof TAddresses]>
            | MaybeEncodedAccount<TAddresses[P & keyof TAddresses]>;
    };
}
