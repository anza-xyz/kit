[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/kit?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/kit?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/kit

# @solana/kit

This is the JavaScript SDK for building Solana apps for Node, web, and React Native.

## Functions

In addition to re-exporting functions from packages in the `@solana/*` namespace, this package offers additional helpers for building Solana applications, with sensible defaults.

### `airdropFactory({rpc, rpcSubscriptions})`

Returns a function that you can call to airdrop a certain amount of `Lamports` to a Solana address.

```ts
import { address, airdropFactory, createSolanaRpc, createSolanaRpcSubscriptions, devnet, lamports } from '@solana/kit';

const rpc = createSolanaRpc(devnet('http://127.0.0.1:8899'));
const rpcSubscriptions = createSolanaRpcSubscriptions(devnet('ws://127.0.0.1:8900'));

const airdrop = airdropFactory({ rpc, rpcSubscriptions });

await airdrop({
    commitment: 'confirmed',
    recipientAddress: address('FnHyam9w4NZoWR6mKN1CuGBritdsEWZQa4Z4oawLZGxa'),
    lamports: lamports(10_000_000n),
});
```

> [!NOTE] This only works on test clusters.

### `decompileTransactionMessageFetchingLookupTables(compiledTransactionMessage, rpc, config)`

Returns a `TransactionMessage` from a `CompiledTransactionMessage`. If any of the accounts in the compiled message require an address lookup table to find their address, this function will use the supplied RPC instance to fetch the contents of the address lookup table from the network.

### `fetchLookupTables(lookupTableAddresses, rpc, config)`

Given a list of addresses belonging to address lookup tables, returns a map of lookup table addresses to an ordered array of the addresses they contain.

### `getMinimumBalanceForRentExemption(space)`

Calculates the minimum `Lamports` required to make an account rent exempt for a given data size, without performing an RPC call.

Values are sourced from the on-chain rent parameters in the Solana runtime:
https://github.com/anza-xyz/solana-sdk/blob/c07f692e41d757057c8700211a9300cdcd6d33b1/rent/src/lib.rs#L93-L97

Note that this logic may change, or be incorrect depending on the cluster you are connected to. You can always use the RPC method `getMinimumBalanceForRentExemption` to get the current value.

```ts
import { getMinimumBalanceForRentExemption } from '@solana/kit';

const mintSize = 82n;
const rentExemptLamports = getMinimumBalanceForRentExemption(mintSize);
```

### `getComputeUnitEstimateForTransactionMessageFactory({rpc})`

Correctly budgeting a compute unit limit for your transaction message can increase the probability that your transaction will be accepted for processing. If you don't declare a compute unit limit on your transaction, validators will assume an upper limit of 200K compute units (CU) per instruction.

Since validators have an incentive to pack as many transactions into each block as possible, they may choose to include transactions that they know will fit into the remaining compute budget for the current block over transactions that might not. For this reason, you should set a compute unit limit on each of your transaction messages, whenever possible.

Use this utility to estimate the actual compute unit cost of a given transaction message.

```ts
import { getSetComputeUnitLimitInstruction } from '@solana-program/compute-budget';
import { createSolanaRpc, getComputeUnitEstimateForTransactionMessageFactory, pipe } from '@solana/kit';

// Create an estimator function.
const rpc = createSolanaRpc('http://127.0.0.1:8899');
const getComputeUnitEstimateForTransactionMessage = getComputeUnitEstimateForTransactionMessageFactory({
    rpc,
});

// Create your transaction message.
const transactionMessage = pipe(
    createTransactionMessage({ version: 'legacy' }),
    /* ... */
);

// Request an estimate of the actual compute units this message will consume. This is done by
// simulating the transaction and grabbing the estimated compute units from the result.
const computeUnitsEstimate = await getComputeUnitEstimateForTransactionMessage(transactionMessage);

// Set the transaction message's compute unit budget.
const transactionMessageWithComputeUnitLimit = prependTransactionMessageInstruction(
    getSetComputeUnitLimitInstruction({ units: computeUnitsEstimate }),
    transactionMessage,
);
```

> [!WARNING]
> The compute unit estimate is just that -- an estimate. The compute unit consumption of the actual transaction might be higher or lower than what was observed in simulation. Unless you are confident that your particular transaction message will consume the same or fewer compute units as was estimated, you might like to augment the estimate by either a fixed number of CUs or a multiplier.

> [!NOTE]
> If you are preparing an _unsigned_ transaction, destined to be signed and submitted to the network by a wallet, you might like to leave it up to the wallet to determine the compute unit limit. Consider that the wallet might have a more global view of how many compute units certain types of transactions consume, and might be able to make better estimates of an appropriate compute unit budget.

> [!INFO]
> In the event that a transaction message does not already have a `SetComputeUnitLimit` instruction, this function will add one before simulation. This ensures that the compute unit consumption of the `SetComputeUnitLimit` instruction itself is included in the estimate.

### `sendAndConfirmTransactionFactory({rpc, rpcSubscriptions})`

Returns a function that you can call to send a blockhash-based transaction to the network and to wait until it has been confirmed.

```ts
import { isSolanaError, sendAndConfirmTransactionFactory, SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED } from '@solana/kit';

const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });

try {
    await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
} catch (e) {
    if (isSolanaError(e, SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED)) {
        console.error('This transaction depends on a blockhash that has expired');
    } else {
        throw e;
    }
}
```

### `sendAndConfirmDurableNonceTransactionFactory({rpc, rpcSubscriptions})`

Returns a function that you can call to send a nonce-based transaction to the network and to wait until it has been confirmed.

```ts
import {
    isSolanaError,
    sendAndConfirmDurableNonceTransactionFactory,
    SOLANA_ERROR__INVALID_NONCE,
    SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND,
} from '@solana/kit';

const sendAndConfirmNonceTransaction = sendAndConfirmDurableNonceTransactionFactory({ rpc, rpcSubscriptions });

try {
    await sendAndConfirmNonceTransaction(transaction, { commitment: 'confirmed' });
} catch (e) {
    if (isSolanaError(e, SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND)) {
        console.error(
            'The lifetime specified by this transaction refers to a nonce account ' +
                `\`${e.context.nonceAccountAddress}\` that does not exist`,
        );
    } else if (isSolanaError(e, SOLANA_ERROR__INVALID_NONCE)) {
        console.error('This transaction depends on a nonce that is no longer valid');
    } else {
        throw e;
    }
}
```

### `sendTransactionWithoutConfirmingFactory({rpc, rpcSubscriptions})`

Returns a function that you can call to send a transaction with any kind of lifetime to the network without waiting for it to be confirmed.

```ts
import {
    sendTransactionWithoutConfirmingFactory,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
} from '@solana/kit';

const sendTransaction = sendTransactionWithoutConfirmingFactory({ rpc });

try {
    await sendTransaction(transaction, { commitment: 'confirmed' });
} catch (e) {
    if (isSolanaError(e, SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE)) {
        console.error('The transaction failed in simulation', e.cause);
    } else {
        throw e;
    }
}
```
