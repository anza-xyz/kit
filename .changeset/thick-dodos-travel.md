---
'@solana/rpc-transport-http': patch
---

Fixed a bug where responses to `getTransactionsForAddress` requests were parsed without `bigint` support, risking precision loss on large integer values
