---
'@solana/transaction-messages': minor
'@solana/rpc-transformers': minor
'@solana/rpc-graphql': minor
'@solana/rpc-types': minor
'@solana/rpc-api': minor
---

Fill in several gaps in transaction v1 (SIMD-0385) support.

`@solana/transaction-messages` now exports its `v1-transaction-config` module, so `setTransactionMessageConfig`, the `V1TransactionConfig` type and the transaction config bit-mask helpers are importable. Previously the module was built and shipped but omitted from the package index, forcing consumers onto the four single-field setters and to derive the config type by hand.

The `V1TransactionConfig.computeUnitLimit` docstring incorrectly described the legacy fallback of 200,000 compute units per instruction. On version 1 an unset `computeUnitLimit` resolves to zero and the transaction fails at execution, so the docstring now says so, as does the one for `loadedAccountsDataSizeLimit`.

`@solana/rpc-types` transaction message types now carry the `transactionConfig` that the server returns for version 1 transactions, so reading a transaction's compute budget no longer requires a cast. Its three `u32` fields are typed and transformed as `number` rather than being upcast to `bigint`, leaving `priorityFee` as the only `Lamports` among them. `@solana/rpc-api` carries the same field on the message shape it uses for the `json` and `jsonParsed` encodings of `getTransaction` and `getTransactionsForAddress`. The same field is exposed on the `TransactionMessage` type in `@solana/rpc-graphql`.
