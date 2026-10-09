---
'@solana/offchain-messages': patch
---

Version-0 offchain messages whose content format is restricted ASCII (format 0) now accept line feeds (`0x0a`) in their body, in addition to the printable ASCII characters in the range `[0x20-0x7e]`. Previously, both encoding and decoding such a message threw `SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE`, contradicting the error message and rejecting messages that the Ledger Solana app is willing to clear-sign.
