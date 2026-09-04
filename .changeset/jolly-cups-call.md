---
'@solana/instructions': minor
---

Add a new `AccountNonSignerMeta` type representing an `AccountMeta` whose role is guaranteed not to be a signer role — i.e. `ReadonlyAccount | WritableAccount`. It is the counterpart of the `AccountSignerMeta` type from `@solana/signers`. Additionally, the `role` member of `WritableAccount`, `ReadonlySignerAccount` and `WritableSignerAccount` is now marked `readonly`, consistently with `ReadonlyAccount` and `AccountMeta`. Note that code mutating the `role` of these types will now fail to compile — which was already contrary to `AccountMeta`'s contract and would throw at runtime on frozen account metas.
