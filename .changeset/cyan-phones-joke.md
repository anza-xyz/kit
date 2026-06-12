---
'@solana/rpc-transformers': patch
---

Stop downcasting `bigint` request params to `number` in the default Solana RPC request transformer

`getDefaultRequestTransformerForSolanaRpc` no longer runs `getBigIntDowncastRequestTransformer`. The Solana RPC transport already serializes `bigint` values losslessly as large integer literals (via `stringifyJsonWithBigInts`), and Agave parses JSON integers across the full `u64` range without precision loss, so the lossy `bigint`->`number` downcast was redundant. Removing it also fixes silent truncation for RPC APIs configured without an `onIntegerOverflow` handler. `getBigIntDowncastRequestTransformer` is now deprecated and slated for removal in a future major version.
