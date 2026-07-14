---
'@solana/react': minor
---

Make the `TClient` type parameter of `useClient` required by removing its `object` default, matching `useClientCapability`. Callers should always pass their client's shape (typically an exported `AppClient` type) so installed capabilities are typed at the call site.

```diff
- const client = useClient();
+ const client = useClient<AppClient>();
```
