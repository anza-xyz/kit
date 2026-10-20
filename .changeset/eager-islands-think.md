---
'@solana/signers': minor
---

Add `getSignersFromInstructionPlan`, which extracts and deduplicates the `TransactionSigners` attached to the instructions of an `InstructionPlan`, alongside the existing `getSignersFromInstruction` and `getSignersFromTransactionMessage` helpers. This lets callers that compile and sign transactions themselves, instead of using a transaction plan executor, collect signers created internally by helpers that return instruction plans. Message packer plans are skipped since their instructions only exist once packed into a transaction message.
