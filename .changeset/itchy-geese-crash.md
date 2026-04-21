---
'@solana/plugin-interfaces': minor
'@solana/kit': minor
---

Add `ClientWithSubscribeToPayer` and `ClientWithSubscribeToIdentity` interfaces. These are a framework-agnostic convention for plugins that mutate `client.payer` / `client.identity` reactively — they install a sibling `subscribeToPayer` / `subscribeToIdentity` function so consumers can observe changes without naming the specific plugin that provides them.
