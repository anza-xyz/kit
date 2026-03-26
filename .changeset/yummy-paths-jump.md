---
"@solana/instruction-plans": patch
---

The transaction planner now handles the four new transaction compilation constraint errors (`TOO_MANY_ACCOUNT_ADDRESSES`, `TOO_MANY_SIGNER_ADDRESSES`, `TOO_MANY_INSTRUCTIONS`, `TOO_MANY_ACCOUNTS_IN_INSTRUCTION`) gracefully. When adding an instruction to an existing candidate transaction would violate a constraint, the planner splits it into a new transaction — the same behaviour it already had for transactions that exceed the byte size limit. If even a fresh transaction cannot accommodate the instruction, the constraint error propagates to the caller.
