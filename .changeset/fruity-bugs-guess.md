---
'@solana/kit': minor
---

Add helpers to create client interfaces from a raw `Rpc`

Add `createClientWithGetMinimumBalanceFromRpc`, `createClientWithFetchAccountsFromRpc` and `createClientWithInterfacesFromRpc` to `@solana/kit`. These convenience helpers let consumers that only have a raw `Rpc` object construct the corresponding client interfaces (`ClientWithGetMinimumBalance` and `ClientWithFetchAccounts`) without assembling a full Kit client. `createClientWithInterfacesFromRpc` fills in whichever interfaces the RPC supports and narrows its return type accordingly.
