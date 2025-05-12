---
'@solana/transaction-messages': minor
'@solana/instructions': minor
'@solana/signers': minor
'@solana/compat': minor
'@solana/kit': minor
---

Remove the `I` prefix on the following types: `IInstruction`, `IInstructionWithAccounts`, `IInstructionWithData`, `IInstructionWithSigners`, `IAccountMeta`, `IAccountLookupMeta` and `IAccountSignerMeta`. The old names are kept as aliases but marked as deprecated.
