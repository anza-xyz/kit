---
'@solana/rpc-subscriptions-channel-websocket': patch
---

Node users no longer need to manually install `ws`. Browser builds remain unaffected as conditional exports ensure `ws` is never bundled for browser environments.
