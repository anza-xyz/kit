---
'@solana/rpc-subscriptions': patch
---

Clear the subscription coalescer cache when the underlying transport rejects before creating a publisher, allowing subsequent subscriptions to retry the connection.
