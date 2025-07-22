---
'@solana/transaction-messages': major
---

BREAKING CHANGE: Removes the following deprecated types and functions: `CompilableTransactionMessage`, `ITransactionMessageWithFeePayer`, `assertIsDurableNonceTransactionMessage` and `isDurableNonceTransaction`. Removes the deprecated `readableIndices` and `writableIndices` properties from the `AddressTableLookup` type — use `readonlyIndexes` and `writableIndexes` respectively instead.
