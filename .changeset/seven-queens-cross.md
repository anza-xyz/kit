---
'@solana/rpc-api': major
---

Always surface `replacementBlockhash` on the `simulateTransaction` response. Agave v3.x validators unconditionally include this field, setting it to `null` when `replaceRecentBlockhash` was not `true`. The field now lives on the base response type as `TransactionBlockhashLifetime | null`, and is narrowed to a non-`null` `TransactionBlockhashLifetime` only on the overloads where `replaceRecentBlockhash: true`.

**BREAKING CHANGES**

**`replacementBlockhash` is now always present on the `simulateTransaction` response.** Previously the field was only present on the type when `replaceRecentBlockhash` was `true`. It is now always present, typed as `TransactionBlockhashLifetime | null`, with `null` indicating that no blockhash was replaced. Code that relied on the field being absent (e.g. to discriminate the response shape) must instead check for `null`.

```diff
const { value } = await rpc.simulateTransaction(tx, { encoding: 'base64' }).send();
- // `value.replacementBlockhash` was not present on the type
+ // `value.replacementBlockhash` is now `TransactionBlockhashLifetime | null` (null here)
```
