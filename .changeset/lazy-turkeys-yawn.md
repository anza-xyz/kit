---
'@solana/instruction-plans': major
'@solana/errors': patch
---

Add configurable instruction-count limits to transaction planners and message packers, and default planned and packed transaction messages to 16 instructions. The planner limit applies to the final transaction message, including instructions returned by `createTransactionMessage` or added by `onTransactionMessageUpdated`, and can be overridden when creating a planner or for an individual planning call.

This is useful because Solana limits transactions to 64 instructions, including inner instructions. Kit does not know how many inner instructions each instruction will require when executed. The default of 16 assumes an average of 3 additional inner instructions per top-level instruction.

When a transaction message reaches this configured ceiling, the planner and message packer throw the new `SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED` error rather than the `SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS` error reserved for the hard 64-instruction limit, so the configurable soft limit is distinguishable from the format-enforced one. Throws `SOLANA_ERROR__INSTRUCTION_PLANS__INVALID_MAX_INSTRUCTIONS_PER_TRANSACTION` is the configured max is invalid (not a positive integer, or greater than 64).

Configure a maximum for every plan created by a transaction planner:

```ts
const transactionPlanner = createTransactionPlanner({
    createTransactionMessage,
    maxInstructionsPerTransaction: 32,
});
```

Override the maximum for an individual planning request:

```ts
const transactionPlan = await transactionPlanner(instructionPlan, {
    maxInstructionsPerTransaction: 8,
});
```

Override the maximum when packing a message directly:

```ts
const packedTransactionMessage = messagePacker.packMessageToCapacity(transactionMessage, {
    maxInstructions: 32,
});
```

**BREAKING CHANGES**

**Transaction planners and message packers now default to 16 instructions per transaction.** Plans and direct message packer calls that previously fit 17 to 64 top-level instructions in one transaction message may now be split into multiple transaction messages. Apps that depend on larger single-transaction plans can preserve the previous top-level instruction limit by configuring `maxInstructionsPerTransaction: 64` on transaction planners or `maxInstructions: 64` on direct message packer calls; the hard transaction-message limit of 64 top-level instructions still applies.

```diff
 const transactionPlanner = createTransactionPlanner({
     createTransactionMessage,
+    maxInstructionsPerTransaction: 64,
 });
```

```diff
-const packedTransactionMessage = messagePacker.packMessageToCapacity(transactionMessage);
+const packedTransactionMessage = messagePacker.packMessageToCapacity(transactionMessage, { maxInstructions: 64 });
```
