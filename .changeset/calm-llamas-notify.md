---
'@solana/rpc-subscriptions-spec': patch
'@solana/rpc-subscriptions-api': patch
'@solana/rpc-transformers': patch
---

Consult the subscriptions numeric allow-list for each notification

The allow-list is keyed by API names like `blockNotifications`, but the plan executor invoked the transformer with the rewritten subscribe request (`blockSubscribe`). The lookup missed and every notification numeric was upcast to `bigint` while still typechecking as `number`.

The transformer now maps `*Subscribe` / `*Notification` names back to `*Notifications`, and the plan executor derives the method name from each notification payload so subscriptions that share a channel are not transformed under whichever request created the publisher.

`blockNotifications` is also derived from the same `innerInstructionsConfigs` / `messageConfig` / `tokenBalancesConfigs` as `getBlock`, so transaction `version`, token balance `uiAmount`, and `stackHeight` stay numbers.
