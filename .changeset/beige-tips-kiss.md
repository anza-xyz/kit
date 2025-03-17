---
'@solana/rpc-api': patch
---

RPC methods that take no parameters no longer rely on having a placeholder `NO_CONFIG` argument. Removing it will save you from wondering why it exists.
