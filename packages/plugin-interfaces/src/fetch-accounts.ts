import { FetchAccountsConfig, MaybeEncodedAccount } from '@solana/accounts';
import { Address } from '@solana/addresses';

/**
 * Represents a client that can fetch the content of accounts from their addresses.
 *
 * Different implementations may fetch accounts differently — for example, by calling the
 * `getAccountInfo` and/or `getMultipleAccounts` RPC methods, by reading from a local validator,
 * or by using a locally cached value.
 *
 * Note that this interface only fetches encoded accounts. Callers that need decoded accounts should
 * decode the returned {@link MaybeEncodedAccount | MaybeEncodedAccounts} themselves using the codec
 * of their choice.
 *
 * If you have a raw `Rpc` object instead of a client, you can construct a client implementing this
 * interface using the {@link createClientWithFetchAccountsFromRpc} helper from `@solana/kit`.
 *
 * @example
 * ```ts
 * async function fetchProgramAddresses(client: ClientWithFetchAccounts, addresses: Address[]) {
 *     const accounts = await client.fetchAccounts(addresses);
 *     return accounts.filter(account => account.exists).map(account => account.programAddress);
 * }
 * ```
 */
export type ClientWithFetchAccounts = {
    /**
     * Fetches the encoded content of the accounts at the provided addresses.
     *
     * The returned array matches the provided addresses in both length and order. Each item is a
     * {@link MaybeEncodedAccount} so that missing accounts can be represented whilst keeping track
     * of their address.
     *
     * @param addresses - The addresses of the accounts to fetch.
     * @param config - Optional configuration for the fetch.
     * @returns A promise resolving to an array of {@link MaybeEncodedAccount | MaybeEncodedAccounts}
     *          in the same order as the provided addresses.
     */
    fetchAccounts: (addresses: Address[], config?: FetchAccountsConfig) => Promise<MaybeEncodedAccount[]>;
};
