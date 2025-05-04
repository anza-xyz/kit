---
'@solana/transaction-messages': patch
---

Deprecated the `writableIndices`/`readableIndices` spellings in transaction messages in favour of `readonlyIndexes`/`writableIndexes`. This will make this shape compatible with the output of the `getTransaction` API that uses those spellings for address lookup table data.
