---
'@solana/rpc-api': minor
---

Add the `getTransactionsForAddress` RPC method type. This method combines address-history discovery and per-transaction fetching into a single query, with server-side filtering, bidirectional sorting, and cursor-based pagination. It will be part of the upcoming solana-rpc spec and is part of the `solana-rpc/superbank` project, and is already available from major RPC providers.

It supports both `signatures` and `full` (`json`/`jsonParsed`/`base58`/`base64`) response modes. The shared transaction metadata types also gain an optional `meta.costUnits` field, which surfaces on `getTransaction` as well.
