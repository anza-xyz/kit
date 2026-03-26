---
"@solana/errors": minor
"@solana/transaction-messages": minor
---

`compileTransactionMessage` now enforces four Solana protocol limits at compile time, throwing a typed `SolanaError` instead of silently producing a transaction that would be rejected by the network:

- More than 64 unique account addresses → `SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES`
- More than 12 unique signer addresses → `SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES`
- More than 64 instructions → `SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS`
- More than 255 accounts in a single instruction → `SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION`

All four error codes (and their context types / human-readable messages) are exported from `@solana/errors`.
