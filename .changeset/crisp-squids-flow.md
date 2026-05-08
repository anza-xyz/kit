---
'@solana/transaction-introspection': minor
'@solana/kit': minor
---

Add `@solana/transaction-introspection`, a new package that bridges a `getTransaction` response and the auto-generated `@solana-program/*` `parseXInstruction` clients. Decodes the transaction (`encoding: 'base64'`, `'base58'`, or `'json'`), resolves account indices against static + ALT-loaded addresses, normalizes inner instructions from `meta.innerInstructions`, and exposes `walkInstructions` / `filterInstructionsForProgram` for streaming traversal of every instruction (outer and inner). Re-exported from `@solana/kit`.
