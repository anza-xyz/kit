---
'@solana/transaction-introspection': minor
---

`decodeTransactionFromRpcResponse` now accepts confirmed transactions from any RPC method that returns them, not just `getTransaction`. It reads only the shared `transaction` / `meta` / `version` envelope, so `getTransactionsForAddress` results (map over its `data` array) and `getBlock` results (map over its `transactions` array, with `transactionDetails: 'full'`) decode identically, including legacy transactions fetched without `maxSupportedTransactionVersion`. The `'json'` overload now types its omitted `transaction` as `never` rather than an optional `Transaction`, reflecting that the JSON path never yields re-encodable wire bytes.
