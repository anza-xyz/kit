---
'@solana/rpc-types': minor
---

Add `UnwrapRpcResponse<T>` type and `splitSolanaRpcResponse()` runtime helper alongside `SolanaRpcResponse`. Use them to decompose notifications that may or may not be wrapped in a `SolanaRpcResponse` envelope into their inner value and slot.

`UnwrapRpcResponse<T>` is a conditional type:

```ts
type UnwrapRpcResponse<T> = T extends SolanaRpcResponse<infer U> ? U : T;
```

`splitSolanaRpcResponse()` runtime-detects the envelope shape (`'context' in x && 'value' in x`) and decomposes accordingly. Raw notifications without the envelope pass through with `slot: undefined`; `undefined` input returns both halves as `undefined`. Overloads narrow the return type to match the input:

```ts
splitSolanaRpcResponse<T>(notification: SolanaRpcResponse<T>): { slot: Slot; value: T };
splitSolanaRpcResponse<T>(notification: T extends SolanaRpcResponse<unknown> ? never : T): { slot: undefined; value: T };
splitSolanaRpcResponse<T>(notification: T): { slot: Slot | undefined; value: UnwrapRpcResponse<T> };
```

The third overload covers everything else — unions of envelope and raw shapes, `T | undefined` piped straight from store state (e.g. `splitSolanaRpcResponse(store.getUnifiedState().data)`).

```ts
splitSolanaRpcResponse({ context: { slot: 99n }, value: { lamports: 5n } });
// → { value: { lamports: 5n }, slot: 99n }

splitSolanaRpcResponse({ slot: 10n, parent: 9n, root: 8n });
// → { value: { slot: 10n, parent: 9n, root: 8n }, slot: undefined }
```
