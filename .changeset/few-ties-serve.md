---
'@solana/plugin-interfaces': patch
---

Fix `ClientWithTransactionPlanning`, `ClientWithTransactionSending` and `ClientWithTransactionSigning` rejecting the `maxInstructionsPerTransaction` option that transaction planners support per call. Their planning, sending and signing functions now accept it, making it possible to override the maximum number of instructions per transaction for a single request. Sending and signing functions only use it when their input needs to be planned first.

```ts
await client.planTransactions(instructions, { maxInstructionsPerTransaction: 8 });
await client.sendTransactions(instructions, { maxInstructionsPerTransaction: 8 });
await client.signTransactions(instructions, { maxInstructionsPerTransaction: 8 });
```
