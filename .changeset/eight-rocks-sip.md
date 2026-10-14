---
'@solana/rpc-subscriptions': patch
---

Fix the channel pool removing an unrelated, healthy channel when the last subscriber of a channel that already errored or failed to construct aborts. The removed channel stayed open for its existing subscribers but was never vended to new subscriptions, and its own eventual teardown removed yet another healthy channel from the pool.
