---
'@solana/react': patch
---

Migrate `@solana/react` to import from `@solana/kit` instead of pinning each consumed sub-package individually. `@solana/subscribable` and `@solana/promises` remain as direct deps because they aren't re-exported by `@solana/kit`.
