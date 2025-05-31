---
'@solana/rpc-spec': patch
---

Fix RPC objects incorrectly appearing as thenable Promises which caused silent program termination when awaited.
