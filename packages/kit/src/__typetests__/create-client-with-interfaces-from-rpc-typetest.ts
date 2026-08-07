import type { ClientWithFetchAccounts, ClientWithGetMinimumBalance } from '@solana/plugin-interfaces';
import type {
    GetAccountInfoApi,
    GetMinimumBalanceForRentExemptionApi,
    GetMultipleAccountsApi,
    Rpc,
    SolanaRpcApi,
} from '@solana/rpc';

import {
    createClientWithFetchAccountsFromRpc,
    createClientWithGetMinimumBalanceFromRpc,
    createClientWithInterfacesFromRpc,
} from '../create-client-with-interfaces-from-rpc';

// [DESCRIBE] createClientWithGetMinimumBalanceFromRpc
{
    // It returns a ClientWithGetMinimumBalance.
    {
        createClientWithGetMinimumBalanceFromRpc(
            null as unknown as Rpc<GetMinimumBalanceForRentExemptionApi>,
        ) satisfies ClientWithGetMinimumBalance;
    }

    // It fails to typecheck when the RPC lacks the getMinimumBalanceForRentExemption method.
    {
        // @ts-expect-error The RPC does not support GetMinimumBalanceForRentExemptionApi.
        createClientWithGetMinimumBalanceFromRpc(null as unknown as Rpc<GetAccountInfoApi>);
    }
}

// [DESCRIBE] createClientWithFetchAccountsFromRpc
{
    // It returns a ClientWithFetchAccounts from an RPC supporting both methods.
    {
        createClientWithFetchAccountsFromRpc(
            null as unknown as Rpc<GetAccountInfoApi & GetMultipleAccountsApi>,
        ) satisfies ClientWithFetchAccounts;
    }

    // It fails to typecheck when the RPC supports getAccountInfo but not getMultipleAccounts.
    {
        // @ts-expect-error The RPC does not support GetMultipleAccountsApi.
        createClientWithFetchAccountsFromRpc(null as unknown as Rpc<GetAccountInfoApi>);
    }

    // It fails to typecheck when the RPC supports getMultipleAccounts but not getAccountInfo.
    {
        // @ts-expect-error The RPC does not support GetAccountInfoApi.
        createClientWithFetchAccountsFromRpc(null as unknown as Rpc<GetMultipleAccountsApi>);
    }

    // It fails to typecheck when the RPC supports neither account-fetching method.
    {
        // @ts-expect-error The RPC does not support GetAccountInfoApi nor GetMultipleAccountsApi.
        createClientWithFetchAccountsFromRpc(null as unknown as Rpc<GetMinimumBalanceForRentExemptionApi>);
    }
}

// [DESCRIBE] createClientWithInterfacesFromRpc
{
    // A minimum-balance-only RPC yields a ClientWithGetMinimumBalance.
    {
        const client = createClientWithInterfacesFromRpc(null as unknown as Rpc<GetMinimumBalanceForRentExemptionApi>);
        client satisfies ClientWithGetMinimumBalance;
        // @ts-expect-error It does not implement ClientWithFetchAccounts.
        client satisfies ClientWithFetchAccounts;
    }

    // A getAccountInfo-only RPC produces no interfaces and is rejected (fetchAccounts requires both
    // account methods, and there is no getMinimumBalanceForRentExemption).
    {
        // @ts-expect-error An RPC with only getAccountInfo cannot produce any interface.
        createClientWithInterfacesFromRpc(null as unknown as Rpc<GetAccountInfoApi>);
    }

    // A getMultipleAccounts-only RPC produces no interfaces and is rejected (fetchAccounts requires
    // both account methods, and there is no getMinimumBalanceForRentExemption).
    {
        // @ts-expect-error An RPC with only getMultipleAccounts cannot produce any interface.
        createClientWithInterfacesFromRpc(null as unknown as Rpc<GetMultipleAccountsApi>);
    }

    // An RPC supporting both account-fetching methods yields a ClientWithFetchAccounts.
    {
        const client = createClientWithInterfacesFromRpc(
            null as unknown as Rpc<GetAccountInfoApi & GetMultipleAccountsApi>,
        );
        client satisfies ClientWithFetchAccounts;
        // @ts-expect-error It does not implement ClientWithGetMinimumBalance.
        client satisfies ClientWithGetMinimumBalance;
    }

    // An RPC supporting getMinimumBalanceForRentExemption but only one account method yields only
    // ClientWithGetMinimumBalance.
    {
        const client = createClientWithInterfacesFromRpc(
            null as unknown as Rpc<GetAccountInfoApi & GetMinimumBalanceForRentExemptionApi>,
        );
        client satisfies ClientWithGetMinimumBalance;
        // @ts-expect-error It does not implement ClientWithFetchAccounts.
        client satisfies ClientWithFetchAccounts;
    }

    // An RPC supporting getMinimumBalanceForRentExemption and both account methods yields both
    // interfaces.
    {
        const client = createClientWithInterfacesFromRpc(
            null as unknown as Rpc<GetAccountInfoApi & GetMinimumBalanceForRentExemptionApi & GetMultipleAccountsApi>,
        );
        client satisfies ClientWithFetchAccounts & ClientWithGetMinimumBalance;
    }

    // A full Solana RPC (a superset of all three methods) also yields both interfaces.
    {
        const client = createClientWithInterfacesFromRpc(null as unknown as Rpc<SolanaRpcApi>);
        client satisfies ClientWithFetchAccounts & ClientWithGetMinimumBalance;
    }
}
