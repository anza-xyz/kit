---
'@solana/rpc-subscriptions-spec': patch
---

Repaired a bug that could cause subscriptions to become 'stuck' and fail to send their unsubscribe message to the RPC, despite the last consumer in your app having released the subscription by calling `AbortController#abort()`
