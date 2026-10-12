---
'@solana/errors': patch
'@solana/sysvars': patch
'@solana/transaction-messages': patch
---

Type-check `SolanaError` contexts in projects whose TypeScript `lib` does not include `ES2022.Error`. The `SolanaError` constructor referenced the global `ErrorOptions` type, which is unresolved without that lib, so with `skipLibCheck` enabled its context parameter silently became `any` and any context was accepted. Fixes the error contexts this was hiding: `compileTransactionMessage` and `decompileTransactionMessage` now report the `unsupportedVersion` in `SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED`, and the `SlotHistory` sysvar decoder now provides the expected context for `SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH` and `SOLANA_ERROR__CODECS__ENUM_DISCRIMINATOR_OUT_OF_RANGE`, so their messages no longer contain unfilled placeholders.
