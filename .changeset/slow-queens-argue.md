---
'@solana/errors': minor
---

Add `createCodedErrorClass` — a factory that lets downstream tooling (Kora, Codama, Keychain, Solana Pay, etc.) build its own strongly-typed, numerically-coded error class backed by the same machinery as `SolanaError`, without having to register its error codes in `@solana/errors`. The returned bundle includes the new error class, a code-narrowing `isError` type guard, and a `getHumanReadableMessage` helper.
