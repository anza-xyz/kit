[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/plugin-interfaces?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/plugin-interfaces?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/plugin-interfaces

# @solana/plugin-interfaces

This package defines common TypeScript interfaces for features that Kit plugins can provide or require. It can be used standalone, but it is also exported as part of Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).

## Overview

When building Solana applications, different environments require different capabilities. A browser wallet might support signing but not RPC calls. A testing environment might support airdrops. A full client might support everything.

These interfaces serve two purposes:

- **Plugins can provide capabilities**: A plugin can implement these interfaces to add features to a client (e.g., a plugin that adds airdrop support implements `ClientWithAirdrop`).
- **Plugins can require capabilities**: A plugin can declare which capabilities it needs from the client to function (e.g., a token plugin might require `ClientWithRpc` to fetch account data).

This enables a composable plugin architecture where plugins can build on top of each other's capabilities.

## Installation

```bash
npm install @solana/plugin-interfaces
```

## Interfaces

### `ClientWithPayer`

Represents a client that provides a default transaction payer.

```ts
import { extendClient } from '@solana/plugin-core';
import { ClientWithPayer } from '@solana/plugin-interfaces';

function memoPlugin() {
    return <T extends ClientWithPayer>(client: T) =>
        extendClient(client, {
            sendMemo: (message: string) => {
                // Use client.payer as the fee payer for the memo transaction
                const feePayer = client.payer;
                // ...
            },
        });
}
```

### `ClientWithAirdrop`

Represents a client that can request SOL airdrops (typically on devnet/testnet). The airdrop succeeds when the promise resolves. Some implementations (e.g., LiteSVM) update balances directly without a transaction, so no signature is returned in those cases.

```ts
import { extendClient } from '@solana/plugin-core';
import { ClientWithAirdrop, ClientWithPayer } from '@solana/plugin-interfaces';

function faucetPlugin() {
    return <T extends ClientWithAirdrop & ClientWithPayer>(client: T) =>
        extendClient(client, {
            fundMyself: async (amount: Lamports) => {
                await client.airdrop(client.payer.address, amount);
            },
        });
}
```

### `ClientWithGetMinimumBalance`

Represents a client that can compute the minimum balance required for an account to be exempt from deletion. Different implementations may compute this differently — for example, by calling the `getMinimumBalanceForRentExemption` RPC method, or by using a locally cached value.

By default, the 128-byte account header is added on top of the provided `space`. Pass `{ withoutHeader: true }` to skip adding the header bytes.

```ts
import { extendClient } from '@solana/plugin-core';
import { ClientWithGetMinimumBalance } from '@solana/plugin-interfaces';

function accountCreationPlugin() {
    return <T extends ClientWithGetMinimumBalance>(client: T) =>
        extendClient(client, {
            getAccountCreationCost: async (dataSize: number) => {
                const minimumBalance = await client.getMinimumBalance(dataSize);
                console.log(`Minimum balance for ${dataSize} bytes: ${minimumBalance} lamports`);
                return minimumBalance;
            },
        });
}
```

### `ClientWithRpc<TRpcMethods>`

Represents a client with access to a Solana RPC endpoint.

```ts
import { extendClient } from '@solana/plugin-core';
import { ClientWithRpc } from '@solana/plugin-interfaces';
import { GetBalanceApi } from '@solana/rpc-api';

function balancePlugin() {
    return <T extends ClientWithRpc<GetBalanceApi>>(client: T) =>
        extendClient(client, {
            getBalance: async (address: Address): Promise<Lamports> => {
                const { value } = await client.rpc.getBalance(address).send();
                return value;
            },
        });
}
```

### `ClientWithRpcSubscriptions<TRpcSubscriptionsMethods>`

Represents a client that provides access to Solana RPC subscriptions for real-time notifications such as account changes, slot updates, and transaction confirmations.

```ts
import { extendClient } from '@solana/plugin-core';
import { ClientWithRpcSubscriptions } from '@solana/plugin-interfaces';
import { AccountNotificationsApi } from '@solana/rpc-subscriptions-api';

function accountWatcherPlugin() {
    return <T extends ClientWithRpcSubscriptions<AccountNotificationsApi>>(client: T) =>
        extendClient(client, {
            onAccountChange: async (address: Address, callback: (lamports: Lamports) => void) => {
                const subscription = await client.rpcSubscriptions.accountNotifications(address).subscribe();
                for await (const notification of subscription) {
                    callback(notification.value.lamports);
                }
            },
        });
}
```

### `ClientWithTransactionPlanning`

Represents a client that can convert instructions or instruction plans into transaction plans.

```ts
import { flattenTransactionPlan } from '@solana/instruction-plans';
import { extendClient } from '@solana/plugin-core';
import { ClientWithTransactionPlanning } from '@solana/plugin-interfaces';

function transactionCounterPlugin() {
    return <T extends ClientWithTransactionPlanning>(client: T) =>
        extendClient(client, {
            countTransactions: async (instructions: IInstruction[]) => {
                const plan = await client.planTransactions(instructions);
                return flattenTransactionPlan(plan).length;
            },
        });
}
```

### `ClientWithTransactionSending`

Represents a client that can send transactions to the Solana network. It supports flexible input formats including instructions, instruction plans, transaction messages, or transaction plans.

```ts
import { extendClient } from '@solana/plugin-core';
import { ClientWithPayer, ClientWithTransactionSending } from '@solana/plugin-interfaces';

function transferPlugin() {
    return <T extends ClientWithPayer & ClientWithTransactionSending>(client: T) =>
        extendClient(client, {
            transfer: async (recipient: Address, amount: Lamports) => {
                const instruction = getTransferSolInstruction({
                    source: client.payer,
                    destination: recipient,
                    amount,
                });
                const result = await client.sendTransaction(instruction);
                return result.context.signature;
            },
        });
}
```

## Combining Interfaces

Use TypeScript intersection types to require multiple capabilities from the client:

```ts
import { extendClient } from '@solana/plugin-core';
import { ClientWithPayer, ClientWithRpc, ClientWithTransactionSending } from '@solana/plugin-interfaces';
import { GetAccountInfoApi } from '@solana/rpc-api';

function tokenTransferPlugin() {
    return <T extends ClientWithPayer & ClientWithRpc<GetAccountInfoApi> & ClientWithTransactionSending>(client: T) =>
        extendClient(client, {
            transferToken: async (mint: Address, recipient: Address, amount: bigint) => {
                // Use client.rpc to fetch token accounts
                // Use client.payer as the token owner
                // Use client.sendTransaction to execute the transfer
            },
        });
}
```
