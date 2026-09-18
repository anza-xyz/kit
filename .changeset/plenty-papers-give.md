---
'@solana/errors': minor
'@solana/instruction-plans': minor
---

Add helpers for writing custom message packers. `resolveMaxInstructionsPerTransaction`, `assertMaxInstructionsPerTransaction` and `assertMessageCanAccommodateSize` enforce the instruction-count and size limits the built-in packers rely on, and a new `SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_REJECTED_BY_PACKER` error lets a packer refuse a transaction message for any other reason by providing a `reason`. The transaction planner treats this error like the existing capacity errors and opens a new transaction message. Use `isMessagePackerErrorThatRequiresNewCandidate` to identify every error that calls for a new transaction message.
