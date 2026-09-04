---
'@solana/program-client-core': minor
'@solana/errors': minor
---

Widen the accepted inputs of instruction accounts in generated program clients. The new `InstructionAccountInput` type accepts an `Address`, any address-bearing object (`HasAddress`) — including framework wrapper classes — a `ProgramDerivedAddress` or an `AccountNonSignerMeta` used to override the role declared by the program's IDL. Similarly, the new `InstructionSignerInput` type accepts a `TransactionSigner` or an `AccountSignerMeta` role override. In addition, `ResolvedInstructionAccount` now carries an optional `isSigner` flag describing the IDL's signer requirement: when set to `false`, `TransactionSigner` values act as plain address carriers instead of being upgraded to signers, and when set to `true`, a missing signer throws a helpful error pointing at `createNoopSigner`. Finally, new `ResolvedInstructionAccountMeta` and `InstructionAccountInputAddress` type helpers mirror this runtime logic at the type level so that generated instruction builders can accurately type the account metas they return.
