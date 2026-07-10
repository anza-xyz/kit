---
'@solana/react': patch
---

Bump the `@wallet-standard/ui` and `@wallet-standard/ui-registry` dependencies to `^1.0.3` and `^1.1.1` respectively. The `1.1.x` registry line is a backward-compatible superset that continues to export the names `@solana/react` relies on, and aligning with it lets consumers that also pull in `@solana/kit-plugin-wallet` resolve a single, shared copy of the wallet-standard UI registry (which is a runtime singleton) instead of splitting across two incompatible copies.
