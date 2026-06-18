---
'@solana/rpc-spec-types': patch
---

Validate `$n` BigInt value objects in `parseJsonWithBigInts` before materializing them. The parser now rejects non-integer and excessively large `$n` values with a `SolanaError` (`SOLANA_ERROR__MALFORMED_BIGINT_STRING`).
