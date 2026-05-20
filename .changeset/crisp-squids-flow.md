---
'@solana/transaction-introspection': minor
'@solana/kit': minor
---

Add `@solana/transaction-introspection`, a new package that bridges a `getTransaction` response and the auto-generated `@solana-program/*` `parseXInstruction` clients. Decodes the transaction (`encoding: 'base64'`, `'base58'`, or `'json'`), resolves account indices against static + ALT-loaded addresses, normalizes inner instructions from `meta.innerInstructions`, and exposes `walkInstructions` to enumerate every instruction (outer and inner) with a `trace` recording its location. Each returned instruction is a `ResolvedInstruction & { trace }` directly usable with `isInstructionForProgram` from `@solana/instructions` and with the auto-generated `identifyXInstruction` / `parseXInstruction` helpers. Supports `legacy`, `v0`, and `v1` compiled transaction messages. Re-exported from `@solana/kit`.
