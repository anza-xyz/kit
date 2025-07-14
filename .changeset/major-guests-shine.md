---
'@solana/transaction-messages': major
'@solana/kit': major
---

Extract lifetime token from `CompiledTransactionMessage`. `CompiledTransactionMessage & CompiledTransactionMessageWithLifetime` may now be used to refer to a compiled transaction message with a lifetime token. This enables `CompiledTransactionMessages` to be encoded without the need to specify a mock lifetime token.
