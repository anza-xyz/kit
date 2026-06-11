---
'@solana/transaction-introspection': minor
'@solana/errors': minor
'@solana/rpc-api': minor
'@solana/kit': minor
---

Add `@solana/transaction-introspection`, a new package that bridges a `getTransaction` response and the auto-generated `@solana-program/*` `parseXInstruction` clients. Decodes the transaction (`encoding: 'base64'`, `'base58'`, or `'json'`), resolves account indices against static + ALT-loaded addresses, normalizes inner instructions from `meta.innerInstructions`, and exposes `walkInstructions` to enumerate every instruction in display order — each outer instruction followed by its inner instructions — with a `trace` recording its location. Each returned instruction is a `ResolvedInstruction & { trace }` directly usable with `isInstructionForProgram` from `@solana/instructions` and with the auto-generated `identifyXInstruction` / `parseXInstruction` helpers. Supports `legacy`, `v0`, and `v1` compiled transaction messages. Re-exported from `@solana/kit`.

```ts
import { createSolanaRpc, signature } from '@solana/kit';
import { isInstructionForProgram } from '@solana/instructions';
import { decodeTransactionFromRpcResponse, walkInstructions } from '@solana/transaction-introspection';
import { identifyTokenInstruction, TOKEN_PROGRAM_ADDRESS, TokenInstruction } from '@solana-program/token';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcTx = await rpc
    .getTransaction(signature(txid), {
        commitment: 'confirmed',
        encoding: 'base64',
        maxSupportedTransactionVersion: 0,
    })
    .send();
if (!rpcTx) throw new Error(`Transaction ${txid} not found`);

const { compiledMessage, loadedAddresses } = decodeTransactionFromRpcResponse(rpcTx);

for (const ix of walkInstructions({ compiledMessage, loadedAddresses, meta: rpcTx.meta })) {
    if (!isInstructionForProgram(ix, TOKEN_PROGRAM_ADDRESS)) continue;
    if (identifyTokenInstruction(ix) === TokenInstruction.SyncNative) {
        console.log('SyncNative found at', ix.trace);
    }
}
```

`@solana/rpc-api` now exports the non-null `getTransaction` response shapes as named types (`GetTransactionApiResponseBase58`, `GetTransactionApiResponseBase64`, `GetTransactionApiResponseJson`, `GetTransactionApiResponseJsonParsed`), which `decodeTransactionFromRpcResponse` accepts as inputs. `@solana/errors` gains `SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_ACCOUNT_INDEX_OUT_OF_RANGE` plus a new `TRANSACTION_INTROSPECTION` domain (`SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION`, `SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE`).
