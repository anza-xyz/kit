---
'@solana/accounts': patch
---

Fix `assertAccountsDecoded` so it preserves each account's address and decoded data type instead of collapsing the array to a single shared type parameter.
