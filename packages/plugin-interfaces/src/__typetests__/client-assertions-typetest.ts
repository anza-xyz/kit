import type { ClientWithAirdrop } from '../airdrop';
import {
    assertIsClientWithAirdrop,
    assertIsClientWithFetchAccounts,
    assertIsClientWithGetMinimumBalance,
    assertIsClientWithIdentity,
    assertIsClientWithPayer,
    assertIsClientWithRpc,
    assertIsClientWithRpcSubscriptions,
    assertIsClientWithSubscribeToIdentity,
    assertIsClientWithSubscribeToPayer,
    assertIsClientWithTransactionPlanning,
    assertIsClientWithTransactionSending,
    isClientWithAirdrop,
    isClientWithFetchAccounts,
    isClientWithGetMinimumBalance,
    isClientWithIdentity,
    isClientWithPayer,
    isClientWithRpc,
    isClientWithRpcSubscriptions,
    isClientWithSubscribeToIdentity,
    isClientWithSubscribeToPayer,
    isClientWithTransactionPlanning,
    isClientWithTransactionSending,
} from '../client-assertions';
import type { ClientWithFetchAccounts } from '../fetch-accounts';
import type { ClientWithGetMinimumBalance } from '../get-minimum-balance';
import type { ClientWithIdentity } from '../identity';
import type { ClientWithTransactionPlanning, ClientWithTransactionSending } from '../instruction-plans';
import type { ClientWithPayer } from '../payer';
import type { ClientWithRpc, ClientWithRpcSubscriptions } from '../rpc';
import type { ClientWithSubscribeToIdentity, ClientWithSubscribeToPayer } from '../subscribe-to';

type CustomClient = { custom: true };

// [DESCRIBE] Client capability type guards and assertions.
{
    // They narrow a custom client to ClientWithAirdrop.
    {
        const client = null as unknown as CustomClient;
        if (isClientWithAirdrop(client)) {
            client satisfies ClientWithAirdrop & CustomClient;
        }
        assertIsClientWithAirdrop(client);
        client satisfies ClientWithAirdrop & CustomClient;
    }

    // They narrow a custom client to ClientWithFetchAccounts.
    {
        const client = null as unknown as CustomClient;
        if (isClientWithFetchAccounts(client)) {
            client satisfies ClientWithFetchAccounts & CustomClient;
        }
        assertIsClientWithFetchAccounts(client);
        client satisfies ClientWithFetchAccounts & CustomClient;
    }

    // They narrow a custom client to ClientWithGetMinimumBalance.
    {
        const client = null as unknown as CustomClient;
        if (isClientWithGetMinimumBalance(client)) {
            client satisfies ClientWithGetMinimumBalance & CustomClient;
        }
        assertIsClientWithGetMinimumBalance(client);
        client satisfies ClientWithGetMinimumBalance & CustomClient;
    }

    // They narrow a custom client to ClientWithIdentity.
    {
        const client = null as unknown as CustomClient;
        if (isClientWithIdentity(client)) {
            client satisfies ClientWithIdentity & CustomClient;
        }
        assertIsClientWithIdentity(client);
        client satisfies ClientWithIdentity & CustomClient;
    }

    // They narrow a custom client to ClientWithPayer.
    {
        const client = null as unknown as CustomClient;
        if (isClientWithPayer(client)) {
            client satisfies ClientWithPayer & CustomClient;
        }
        assertIsClientWithPayer(client);
        client satisfies ClientWithPayer & CustomClient;
    }

    // They narrow a custom client to ClientWithRpc, preserving its RPC method type.
    {
        type TestRpcMethods = { getValue(): number };
        const client = null as unknown as CustomClient;
        if (isClientWithRpc<TestRpcMethods>(client)) {
            client satisfies ClientWithRpc<TestRpcMethods> & CustomClient;
        }
        assertIsClientWithRpc<TestRpcMethods>(client);
        client satisfies ClientWithRpc<TestRpcMethods> & CustomClient;
    }

    // They narrow a custom client to ClientWithRpcSubscriptions, preserving its method type.
    {
        type TestRpcSubscriptionsMethods = { valueNotifications(): number };
        const client = null as unknown as CustomClient;
        if (isClientWithRpcSubscriptions<TestRpcSubscriptionsMethods>(client)) {
            client satisfies ClientWithRpcSubscriptions<TestRpcSubscriptionsMethods> & CustomClient;
        }
        assertIsClientWithRpcSubscriptions<TestRpcSubscriptionsMethods>(client);
        client satisfies ClientWithRpcSubscriptions<TestRpcSubscriptionsMethods> & CustomClient;
    }

    // They narrow a custom client to ClientWithSubscribeToIdentity.
    {
        const client = null as unknown as CustomClient;
        if (isClientWithSubscribeToIdentity(client)) {
            client satisfies ClientWithSubscribeToIdentity & CustomClient;
        }
        assertIsClientWithSubscribeToIdentity(client);
        client satisfies ClientWithSubscribeToIdentity & CustomClient;
    }

    // They narrow a custom client to ClientWithSubscribeToPayer.
    {
        const client = null as unknown as CustomClient;
        if (isClientWithSubscribeToPayer(client)) {
            client satisfies ClientWithSubscribeToPayer & CustomClient;
        }
        assertIsClientWithSubscribeToPayer(client);
        client satisfies ClientWithSubscribeToPayer & CustomClient;
    }

    // They narrow a custom client to ClientWithTransactionPlanning.
    {
        const client = null as unknown as CustomClient;
        if (isClientWithTransactionPlanning(client)) {
            client satisfies ClientWithTransactionPlanning & CustomClient;
        }
        assertIsClientWithTransactionPlanning(client);
        client satisfies ClientWithTransactionPlanning & CustomClient;
    }

    // They narrow a custom client to ClientWithTransactionSending.
    {
        const client = null as unknown as CustomClient;
        if (isClientWithTransactionSending(client)) {
            client satisfies ClientWithTransactionSending & CustomClient;
        }
        assertIsClientWithTransactionSending(client);
        client satisfies ClientWithTransactionSending & CustomClient;
    }
}
