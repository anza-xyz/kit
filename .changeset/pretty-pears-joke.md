---
'@solana/signers': patch
---

Relaxed the parameter type of the signer type guards (`isMessagePartialSigner`, `isTransactionSigner`, `isKeyPairSigner`, their siblings, and the `assertIs*` variants) so that class instances implementing a signer interface can be passed without casts. The guards now accept any `TValue extends { address: Address }` and narrow to `TValue & Signer`, whereas the previous parameter type required an implicit index signature, which TypeScript never grants to class instances.
