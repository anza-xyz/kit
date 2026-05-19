---
'@solana/rpc-types': minor
---

Add `UnwrapRpcResponse<T>` type and `isSolanaRpcResponse()` runtime helper alongside `SolanaRpcResponse`. Use them to detect and unwrap notifications that may or may not be wrapped in a `SolanaRpcResponse` envelope.

`UnwrapRpcResponse<T>` is a conditional type:

```ts
type UnwrapRpcResponse<T> = T extends SolanaRpcResponse<infer U> ? U : T;
```

`isSolanaRpcResponse()` is a type guard that validates the envelope shape by checking `context.slot: bigint` and the presence of `value`, leaving room for additional envelope fields without changing the guard's contract. The narrowed type is `SolanaRpcResponse<UnwrapRpcResponse<T>>`, so callers don't need to spell out the inner type separately.

```ts
import { isSolanaRpcResponse } from '@solana/rpc-types';

function lift<T>(notification: T) {
    if (isSolanaRpcResponse(notification)) {
        return { slot: notification.context.slot, value: notification.value };
    }
    return { slot: undefined, value: notification };
}
```
