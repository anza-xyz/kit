---
'@solana/rpc-api': minor
---

Add `innerInstructionsEncoding` to the `simulateTransaction` config. Set it to `'json'` to receive every inner instruction in compiled form (`programIdIndex`, `accounts`, `data`) instead of the default `'jsonParsed'` output. Supported by Agave 4.5+ (anza-xyz/agave#16165); older nodes ignore the option and return `jsonParsed` inner instructions, so the response type remains `TransactionForFullMetaInnerInstructionsParsed | TransactionForFullMetaInnerInstructionsUnparsed`.
