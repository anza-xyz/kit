---
'@solana/rpc': patch
'@solana/transaction-confirmation': patch
---

Fix transaction confirmation and coalesced RPC request cancellation in environments where abort events have a null target.
