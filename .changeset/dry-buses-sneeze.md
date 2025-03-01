---
"@solana/web3.js": patch
"@solana/transaction-confirmation": patch
---

Added a transaction confirmation strategy that polls the RPC for blockheight and signature updates rather than to use the websockets API. This is not recommended, but is supplied for anyone that does not have a websocket API available.
