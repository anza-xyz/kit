import { BASE_ACCOUNT_SIZE, fetchEncodedAccount, fetchEncodedAccounts } from '@solana/accounts';
import type { ClientWithFetchAccounts, ClientWithGetMinimumBalance } from '@solana/plugin-interfaces';
import type { GetAccountInfoApi, GetMinimumBalanceForRentExemptionApi, GetMultipleAccountsApi, Rpc } from '@solana/rpc';
import { lamports } from '@solana/rpc-types';

/**
 * Creates a {@link ClientWithGetMinimumBalance} from a raw `Rpc` object.
 *
 * The returned client computes the minimum balance for rent exemption using the
 * {@link GetMinimumBalanceForRentExemptionApi.getMinimumBalanceForRentExemption | getMinimumBalanceForRentExemption}
 * RPC method. By default, the 128-byte account header is included on top of the provided `space`;
 * pass `{ withoutHeader: true }` to compute the minimum balance for the data portion only.
 *
 * This is a convenience helper for consumers that only have a raw `Rpc` object rather than a Kit
 * client. If you are building a full client, prefer composing it with a plugin such as `solanaRpc`
 * (i.e. `createClient().use(solanaRpc(...))`), which provides `getMinimumBalance` amongst other
 * capabilities.
 *
 * @param rpc - An object that supports the {@link GetMinimumBalanceForRentExemptionApi} of the
 *              Solana RPC API.
 *
 * @example
 * ```ts
 * const client = createClientWithGetMinimumBalanceFromRpc(rpc);
 * const rentExemptBalance = await client.getMinimumBalance(100);
 * ```
 */
export function createClientWithGetMinimumBalanceFromRpc(
    rpc: Rpc<GetMinimumBalanceForRentExemptionApi>,
): ClientWithGetMinimumBalance {
    return {
        async getMinimumBalance(space, config) {
            if (config?.withoutHeader) {
                // The runtime computes rent as `rate * (BASE_ACCOUNT_SIZE + space)`, where `rate`
                // folds in the per-byte cost and the exemption threshold (see Agave's
                // `Rent::minimum_balance`). Querying `space = 0` therefore returns `rate * 128`,
                // which divides evenly by `BASE_ACCOUNT_SIZE` to recover `rate` exactly. There is
                // no truncation here: `rate * 128 / 128 === rate`.
                const headerBalance = await rpc.getMinimumBalanceForRentExemption(0n).send();
                const lamportsPerByte = headerBalance / BigInt(BASE_ACCOUNT_SIZE);
                return lamports(lamportsPerByte * BigInt(space));
            }
            return await rpc.getMinimumBalanceForRentExemption(BigInt(space)).send();
        },
    };
}

/**
 * Creates a {@link ClientWithFetchAccounts} from a raw `Rpc` object.
 *
 * The returned client fetches the encoded content of accounts from their addresses, dispatching on
 * the number of requested addresses: a single account is fetched via the
 * {@link GetAccountInfoApi.getAccountInfo | getAccountInfo} RPC method, whilst multiple accounts are
 * fetched in a single round-trip via the
 * {@link GetMultipleAccountsApi.getMultipleAccounts | getMultipleAccounts} RPC method. Fetching an
 * empty list short-circuits to an empty array without issuing any RPC call.
 *
 * The dispatch is based purely on the number of addresses because a raw `Rpc` object's capabilities
 * cannot be detected at runtime. For this reason, the `Rpc` is required to support both methods.
 *
 * This is a convenience helper for consumers that only have a raw `Rpc` object rather than a Kit
 * client. If you are building a full client, prefer composing it with a plugin such as `solanaRpc`
 * (i.e. `createClient().use(solanaRpc(...))`), which provides account fetching amongst other
 * capabilities.
 *
 * @param rpc - An object that supports both the {@link GetAccountInfoApi} and the
 *              {@link GetMultipleAccountsApi} of the Solana RPC API.
 *
 * @example
 * ```ts
 * const client = createClientWithFetchAccountsFromRpc(rpc);
 * const accounts = await client.fetchAccounts([addressA, addressB]);
 * ```
 */
export function createClientWithFetchAccountsFromRpc(
    rpc: Rpc<GetAccountInfoApi & GetMultipleAccountsApi>,
): ClientWithFetchAccounts {
    return {
        async fetchAccounts(addresses, config) {
            if (addresses.length === 0) {
                return [];
            }
            if (addresses.length === 1) {
                return [await fetchEncodedAccount(rpc, addresses[0], config)];
            }
            return await fetchEncodedAccounts(rpc, addresses, config);
        },
    };
}

type ClientInterfacesFromRpc<TRpc> = (TRpc extends Rpc<GetAccountInfoApi & GetMultipleAccountsApi>
    ? ClientWithFetchAccounts
    : object) &
    (TRpc extends Rpc<GetMinimumBalanceForRentExemptionApi> ? ClientWithGetMinimumBalance : object);

/**
 * Creates a client from a raw `Rpc` object, filling in whichever client interfaces the RPC supports.
 *
 * The returned object's type implements a {@link ClientWithGetMinimumBalance} when the RPC supports
 * the {@link GetMinimumBalanceForRentExemptionApi}, and a {@link ClientWithFetchAccounts} when it
 * supports both the {@link GetAccountInfoApi} and the {@link GetMultipleAccountsApi}. The return
 * type reflects the interfaces available on the provided RPC, so you only get the interfaces your
 * RPC can actually back.
 *
 * Because a raw `Rpc` object's capabilities cannot be detected at runtime, the returned object
 * always carries both `getMinimumBalance` and `fetchAccounts` at runtime; the return type is what
 * narrows them to the interfaces your RPC declares. Invoking a method that your `Rpc` does not
 * actually support will fail when the underlying RPC method is called.
 *
 * Note that this does not create a fully-fledged Kit client — it only wraps the RPC in the account
 * interfaces above. To build a complete client, use `createClient().use(solanaRpc(...))` instead,
 * which additionally exposes the underlying RPC and other capabilities.
 *
 * @param rpc - A raw `Rpc` object that supports either the
 *              {@link GetMinimumBalanceForRentExemptionApi}, or both the {@link GetAccountInfoApi}
 *              and the {@link GetMultipleAccountsApi} (otherwise no interface can be produced). The
 *              interfaces exposed on the returned client's type depend on which RPC methods it
 *              supports.
 *
 * @example
 * ```ts
 * // With an RPC supporting both APIs, the client implements both interfaces.
 * const client = createClientWithInterfacesFromRpc(rpc);
 * const rentExemptBalance = await client.getMinimumBalance(100);
 * const accounts = await client.fetchAccounts([addressA, addressB]);
 * ```
 */
export function createClientWithInterfacesFromRpc<
    TRpc extends Rpc<GetAccountInfoApi & GetMultipleAccountsApi> | Rpc<GetMinimumBalanceForRentExemptionApi>,
>(rpc: TRpc): ClientInterfacesFromRpc<TRpc> {
    // Both interfaces are built unconditionally; the return type narrows them to whatever the RPC
    // declares. Runtime capability detection is not possible on a raw `Rpc` object.
    return {
        ...createClientWithGetMinimumBalanceFromRpc(rpc as Rpc<GetMinimumBalanceForRentExemptionApi>),
        ...createClientWithFetchAccountsFromRpc(rpc as Rpc<GetAccountInfoApi & GetMultipleAccountsApi>),
    } as ClientInterfacesFromRpc<TRpc>;
}
