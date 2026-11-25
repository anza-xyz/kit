---
'@solana/errors': patch
---

Fix a `TypeError` when an RPC server returns a `sendTransaction` preflight failure (`-32002`) without a simulation result in `data`. The resulting `SolanaError` now has every simulation field set to `null`, and the server's message is preserved as `context.__serverMessage`.
