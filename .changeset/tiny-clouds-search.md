---
'@solana/plugin-core': minor
---

Add `extendClient` helper for plugin authors to merge client objects while preserving property descriptors (getters, symbol-keyed properties, and non-enumerable properties).

Plugin authors should migrate plugins to use this instead of spreading the input client.

```diff
- return { ...client, rpc };
+ return extendClient(client, { rpc });
```
