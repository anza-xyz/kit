---
'@solana/rpc-transformers': patch
'@solana/errors': patch
---

Fix type of error in sendTransaction preflight error

Some fields in `RpcSimulateTransactionResult` were incorrectly typed as number when they should have been bigint. At runtime these were bigint because of a bug.

At runtime all numeric fields in `RpcSimulateTransactionResult` were a bigint, but those typed as number are now correct.
