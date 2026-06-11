[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/transaction-introspection?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/transaction-introspection?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/transaction-introspection

# @solana/transaction-introspection

This package contains helpers for inspecting a confirmed Solana transaction's instructions — both top-level and inner CPI — in a form that the auto-generated `@solana-program/*` clients can `identify` and `parse` directly. It can be used standalone, but it is also exported as part of Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).

The kit codecs decode a `getTransaction` response down to a `CompiledTransactionMessage`. The per-program clients (`identifyTokenInstruction`, `parseSyncNativeInstruction`, etc.) accept kit `Instruction` objects. This package fills the gap between them: it decodes the wire transaction, resolves account indices against static keys plus ALT-loaded addresses, normalizes the JSON-shape inner instructions from `meta.innerInstructions`, and returns a single list of traced instructions directly usable with the auto-generated `@solana-program/*` clients and with `isInstructionForProgram` from `@solana/instructions`. Supports `legacy`, `v0`, and `v1` compiled transaction messages.

## Quick start

Audit every Token-Program `SyncNative` instruction — outer or inner CPI — in a confirmed transaction:

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
    if (identifyTokenInstruction(ix) !== TokenInstruction.SyncNative) continue;
    console.log(
        `SyncNative at ${ix.trace.kind === 'outer' ? `outer[${ix.trace.index}]` : `inner[${ix.trace.outerIndex}/${ix.trace.innerIndex}]`}`,
    );
}
```

## Functions

### `decodeTransactionFromRpcResponse(rpcTx)`

Decodes a `getTransaction` response — `encoding: 'base64'`, `'base58'`, or `'json'` — into a `DecodedRpcTransaction`: the `CompiledTransactionMessage` (always carrying the recent blockhash in `lifetimeToken`), the loaded ALT addresses pulled from `meta` (or empty arrays for legacy transactions where `meta.loadedAddresses` is not present), and — for `'base64'` and `'base58'` only — the re-encodable wire-format `Transaction`.

Prefer `encoding: 'base64'` when bandwidth allows — it is the most compact, the wire bytes round-trip cleanly through the kit codecs, and the return type statically guarantees a non-undefined `transaction`. `encoding: 'json'` is also accepted, but `transaction` is omitted because the server has already decompiled the wire format and there are no message bytes to carry. `encoding: 'jsonParsed'` is **not** supported — its instructions arrive pre-parsed and lack raw bytes, so they cannot be round-tripped through the auto-generated `parseXInstruction` clients.

```ts
import { createSolanaRpc, signature } from '@solana/kit';
import { decodeTransactionFromRpcResponse } from '@solana/transaction-introspection';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcTx = await rpc
    .getTransaction(signature(txid), {
        commitment: 'confirmed',
        encoding: 'base64',
        maxSupportedTransactionVersion: 0,
    })
    .send();
if (!rpcTx) throw new Error('not found');

const { compiledMessage, loadedAddresses, transaction } = decodeTransactionFromRpcResponse(rpcTx);
```

### `getAccountMetasFromCompiledTransactionMessage(compiledMessage, loadedAddresses?)`

Builds the full ordered list of `AccountMeta`s for the message. If you only need the flat ordered `Address[]`, map over the result: `accountMetas.map(m => m.address)`. Roles are derived from the message header: writable signers, readonly signers, writable non-signers, readonly non-signers — followed by ALT-loaded writable (non-signer, writable) and ALT-loaded readonly (non-signer, readonly). Inner-instruction account indices reference the same flat list, so the result is also useful for resolving inner instructions.

```ts
import { getAccountMetasFromCompiledTransactionMessage } from '@solana/transaction-introspection';

const accountMetas = getAccountMetasFromCompiledTransactionMessage(compiledMessage, loadedAddresses);
```

### `getInstructionsFromCompiledTransactionMessage(compiledMessage, loadedAddresses?)`

Returns the outer instructions of a compiled transaction message as `ResolvedInstruction[]`. Each instruction has its account indices resolved to `AccountMeta`s (with proper signer/writable bits) and its data exposed as a `ReadonlyUint8Array` — the form the auto-generated `@solana-program/*` `parseXInstruction` and `identifyXInstruction` functions expect.

```ts
import { getInstructionsFromCompiledTransactionMessage } from '@solana/transaction-introspection';
import { identifyTokenInstruction, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

const instructions = getInstructionsFromCompiledTransactionMessage(compiledMessage, loadedAddresses);
for (const ix of instructions) {
    if (ix.programAddress === TOKEN_PROGRAM_ADDRESS) {
        const kind = identifyTokenInstruction(ix);
        // ...
    }
}
```

### `getInnerInstructionsFromMeta(meta, accountMetas)`

Returns the inner instructions in a `getTransaction` response as `TracedInstruction`s. The RPC returns inner instructions in a different shape from the wire format — indices reference the same flat account list as outer instructions, but `data` is base58-encoded. This helper decodes the data, resolves the indices against the supplied `AccountMeta` list, and tags each instruction with an `inner` trace (carrying `outerIndex`, `innerIndex`, and `stackHeight` when the RPC provides one).

```ts
import {
    getAccountMetasFromCompiledTransactionMessage,
    getInnerInstructionsFromMeta,
} from '@solana/transaction-introspection';

const accountMetas = getAccountMetasFromCompiledTransactionMessage(compiledMessage, loadedAddresses);
const inner = getInnerInstructionsFromMeta(rpcTx.meta, accountMetas);
```

### `walkInstructions({ compiledMessage, meta?, loadedAddresses? })`

Returns every instruction in a confirmed transaction — outer first, then inner instructions grouped by their outer-instruction index — as an array of `TracedInstruction`s. Each entry is itself a `ResolvedInstruction` (with addresses and roles already resolved) carrying a `trace` property that records whether the instruction is outer or inner (with stack height when the RPC provides it).

Because each entry is a `ResolvedInstruction`, you can pass it directly to `isInstructionForProgram` from `@solana/instructions` (which narrows the `programAddress` type) and to the auto-generated `identifyXInstruction` / `parseXInstruction` helpers — no separate filter helper is needed.

If `meta` is omitted, only outer instructions are returned. If `loadedAddresses` is omitted, only static accounts are used to resolve indices — pass `meta?.loadedAddresses` for v0 transactions that load accounts from address lookup tables.

```ts
import { isInstructionForProgram } from '@solana/instructions';
import { walkInstructions } from '@solana/transaction-introspection';
import {
    identifyTokenInstruction,
    parseSyncNativeInstruction,
    TOKEN_PROGRAM_ADDRESS,
    TokenInstruction,
} from '@solana-program/token';

for (const ix of walkInstructions({ compiledMessage, loadedAddresses, meta: rpcTx.meta })) {
    if (!isInstructionForProgram(ix, TOKEN_PROGRAM_ADDRESS)) continue;
    // `ix.programAddress` is narrowed to TOKEN_PROGRAM_ADDRESS.
    if (identifyTokenInstruction(ix) === TokenInstruction.SyncNative) {
        const parsed = parseSyncNativeInstruction(ix);
        console.log(ix.trace, parsed);
    }
}
```

## Types

### `LoadedAddresses`

The shape of `meta.loadedAddresses` from `getTransaction`. Two arrays — `writable` and `readonly` — kept in the same order the runtime uses to resolve instruction account indices.

```ts
import type { LoadedAddresses } from '@solana/transaction-introspection';

const loaded: LoadedAddresses = rpcTx.meta?.loadedAddresses ?? { readonly: [], writable: [] };
```

### `DecodedRpcTransaction`

`{ compiledMessage, loadedAddresses, transaction? }`. `compiledMessage` always carries a `lifetimeToken` (the recent blockhash). `transaction` is present only for `'base64'` and `'base58'` responses; the dispatcher's overloads narrow it to a non-optional `Transaction` for those encodings.

The input side of `decodeTransactionFromRpcResponse` is typed with the `GetTransactionApiResponseBase64`, `GetTransactionApiResponseBase58`, and `GetTransactionApiResponseJson` types from `@solana/rpc-api` — the non-null response shapes of the corresponding `getTransaction` encodings.

### `ResolvedInstruction<TProgramAddress>`

An `Instruction` whose account indices have been resolved to `AccountMeta`s and whose data is exposed as a `ReadonlyUint8Array`. Directly usable with the auto-generated `@solana-program/*` `parseXInstruction` and `identifyXInstruction` functions, and with `isInstructionForProgram` from `@solana/instructions` (which narrows the `TProgramAddress` parameter).

### `InstructionTrace`

A discriminated union recording an instruction's location within a transaction:

- `{ kind: 'outer', index }` — a top-level instruction in the compiled message.
- `{ kind: 'inner', outerIndex, innerIndex, stackHeight? }` — an instruction emitted via cross-program invocation. `stackHeight` is included only when reported by the RPC.

### `TracedInstruction<TProgramAddress>`

A `ResolvedInstruction<TProgramAddress>` with an extra `trace: InstructionTrace` property — one entry returned by `walkInstructions`. Because it is itself a `ResolvedInstruction`, it can be passed directly to `isInstructionForProgram` and to the auto-generated `identifyXInstruction` / `parseXInstruction` helpers.

### `MetaWithInnerInstructions`

A structural type capturing the minimum shape of `getTransaction`'s `meta` field that `getInnerInstructionsFromMeta` needs. Accepting a structural type keeps callers free to pass the full RPC response without coupling to a specific overload.

## Notes

- Supports `legacy`, `v0`, and `v1` compiled transaction messages. Pass any version through `decodeTransactionFromRpcResponse` and `walkInstructions` — account indices, inner instructions, and ALT-loaded addresses resolve identically across versions. To actually receive `v0` or `v1` from the RPC you still need to set `maxSupportedTransactionVersion` on the `getTransaction` call — without it, the server downgrades anything past legacy to an error.
- `decodeTransactionFromRpcResponse` accepts `encoding: 'base64'`, `'base58'`, or `'json'`. `'jsonParsed'` is not supported — its instructions arrive pre-parsed by the server and lack raw bytes.
