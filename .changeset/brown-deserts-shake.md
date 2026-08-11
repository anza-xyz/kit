---
'@solana/react': patch
---

Widen the `@solana/kit` peer dependency of `@solana/react` from an exact version to a caret range. `@solana/react` previously declared `"@solana/kit": "workspace:*"`, which publishes as an exact pin (`"@solana/kit": "7.0.0"`), so a consumer who advanced `@solana/kit` without advancing `@solana/react` in the same step hit an unsatisfiable peer range even though the two are compatible. It now declares `workspace:^` and publishes as `^7.1.0`. The two packages continue to be released in lockstep at identical versions, so this does not loosen which combinations are actually shipped — it only stops describing a compatible pair as incompatible.
