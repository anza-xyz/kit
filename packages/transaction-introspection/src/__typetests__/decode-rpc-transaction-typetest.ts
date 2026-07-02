import type { Address } from '@solana/addresses';
import type {
    GetBlockApi,
    GetTransactionApiResponseBase58,
    GetTransactionApiResponseBase64,
    GetTransactionApiResponseJson,
    GetTransactionsForAddressApi,
} from '@solana/rpc-api';
import type { Slot } from '@solana/rpc-types';
import type { Transaction } from '@solana/transactions';

import { decodeTransactionFromRpcResponse } from '../decode-rpc-transaction';

void (() => {
    const b64 = null as unknown as GetTransactionApiResponseBase64;
    const b58 = null as unknown as GetTransactionApiResponseBase58;
    const j = null as unknown as GetTransactionApiResponseJson;

    // base64 / base58 narrow `transaction` to a guaranteed `Transaction`.
    decodeTransactionFromRpcResponse(b64).transaction satisfies Transaction;
    decodeTransactionFromRpcResponse(b58).transaction satisfies Transaction;

    // JSON path returns optional `transaction` — must not be assignable to a bare `Transaction`.
    decodeTransactionFromRpcResponse(j).transaction satisfies Transaction | undefined;
    // @ts-expect-error — JSON path's `transaction` is optional and must not narrow to `Transaction`.
    decodeTransactionFromRpcResponse(j).transaction satisfies Transaction;
});

// A `getTransactionsForAddress` `'full'` result carries the same `transaction` /
// `meta` / `version` envelope as a `getTransaction` response — it merely adds
// `slot` / `blockTime` / `transactionIndex`, which the decoder ignores. These
// tests derive the real result-element types from the public API (rather than a
// hand-written literal, which would trip excess-property checks) to document
// exactly how far the decoder accepts them today, encoding-for-encoding.
//
// VERSIONED results (`maxSupportedTransactionVersion` set) are already accepted:
// the `getTransaction` envelope's versioned branch is `{ version }`, an open
// object that tolerates the extra `transactionIndex`.
void (() => {
    const api = null as unknown as GetTransactionsForAddressApi;
    const address = null as unknown as Address;

    const b64 = api.getTransactionsForAddress(address, {
        encoding: 'base64',
        maxSupportedTransactionVersion: 0,
        transactionDetails: 'full',
    }).data[0];
    const b58 = api.getTransactionsForAddress(address, {
        encoding: 'base58',
        maxSupportedTransactionVersion: 0,
        transactionDetails: 'full',
    }).data[0];
    const j = api.getTransactionsForAddress(address, {
        encoding: 'json',
        maxSupportedTransactionVersion: 0,
        transactionDetails: 'full',
    }).data[0];

    // Wire encodings resolve to the base64/base58 overloads → guaranteed `Transaction`.
    decodeTransactionFromRpcResponse(b64).transaction satisfies Transaction;
    decodeTransactionFromRpcResponse(b58).transaction satisfies Transaction;

    // JSON resolves to the json overload → `transaction` is always absent (`?: never`).
    decodeTransactionFromRpcResponse(j).transaction satisfies Transaction | undefined;
    decodeTransactionFromRpcResponse(j).transaction satisfies undefined;
    // @ts-expect-error — JSON path's `transaction` is never present and must not narrow to `Transaction`.
    decodeTransactionFromRpcResponse(j).transaction satisfies Transaction;
});

// LEGACY results (no `maxSupportedTransactionVersion`) decode just the same. The
// decoder reads only the minimal `transaction` / `meta` / `version` envelope, so
// it no longer trips on the extra `transactionIndex` that the older,
// envelope-typed overloads rejected via their `Record<string, never>` guard.
void (() => {
    const api = null as unknown as GetTransactionsForAddressApi;
    const address = null as unknown as Address;

    const b64Legacy = api.getTransactionsForAddress(address, {
        encoding: 'base64',
        transactionDetails: 'full',
    }).data[0];
    const jLegacy = api.getTransactionsForAddress(address, {
        encoding: 'json',
        transactionDetails: 'full',
    }).data[0];

    decodeTransactionFromRpcResponse(b64Legacy).transaction satisfies Transaction;
    decodeTransactionFromRpcResponse(jLegacy).transaction satisfies undefined;
});

// `getBlock` with `transactionDetails: 'full'` returns the same
// `transaction` / `meta` / `version` envelope per element of its `transactions`
// array, so those decode identically. Derive the real element types from the
// public API to prove it, encoding-for-encoding.
void (() => {
    const api = null as unknown as GetBlockApi;
    const slot = null as unknown as Slot;

    const b64 = api.getBlock(slot, {
        encoding: 'base64',
        maxSupportedTransactionVersion: 0,
        transactionDetails: 'full',
    })?.transactions[0];
    const j = api.getBlock(slot, {
        encoding: 'json',
        transactionDetails: 'full',
    })?.transactions[0];

    // Wire encoding → guaranteed `Transaction`; JSON → `transaction` always absent.
    // (`?.` because `getBlock` returns `null` for a skipped slot.)
    if (b64) decodeTransactionFromRpcResponse(b64).transaction satisfies Transaction;
    if (j) decodeTransactionFromRpcResponse(j).transaction satisfies undefined;
});
