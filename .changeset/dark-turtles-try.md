---
'@solana/errors': patch
---

Refactor `SolanaError` to be produced by `createCodedErrorClass`, eliminating the dual implementation of the same pattern in this package. Behavior (dev/prod message format, instruction-error-index suffix, `cause` / deprecated-cause typing, guard narrowing, frozen context) is preserved exactly. As a side benefit, `isSolanaError`'s guard is now defensively hardened against same-name foreign errors via the factory's shared guard.

Two additive optional fields on `CodedErrorDefinition` support SolanaError's specific behaviors and are available to any downstream consumer: `prodMessagePrefix` (override the leading token of prod-mode messages) and `messagePostProcessor` (hook for appending a suffix like `" (instruction #N)"` after template interpolation).
