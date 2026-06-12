import type { Transaction } from '@solana/transactions';

import {
    type Base58GetTransactionResponse,
    type Base64GetTransactionResponse,
    decodeTransactionFromRpcResponse,
    type JsonGetTransactionResponse,
} from '../decode-rpc-transaction';

void (() => {
    const b64 = null as unknown as Base64GetTransactionResponse;
    const b58 = null as unknown as Base58GetTransactionResponse;
    const j = null as unknown as JsonGetTransactionResponse;

    // base64 / base58 narrow `transaction` to a guaranteed `Transaction`.
    decodeTransactionFromRpcResponse(b64).transaction satisfies Transaction;
    decodeTransactionFromRpcResponse(b58).transaction satisfies Transaction;

    // JSON path returns optional `transaction` — must not be assignable to a bare `Transaction`.
    decodeTransactionFromRpcResponse(j).transaction satisfies Transaction | undefined;
    // @ts-expect-error — JSON path's `transaction` is optional and must not narrow to `Transaction`.
    decodeTransactionFromRpcResponse(j).transaction satisfies Transaction;
});
