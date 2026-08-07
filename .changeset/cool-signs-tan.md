---
'@solana/plugin-interfaces': minor
---

Add a `ClientWithTransactionSigning` interface providing `signTransaction` and `signTransactions`. These accept the same flexible inputs as their `ClientWithTransactionSending` counterparts, but hand back the signed transactions instead of submitting them. The interface is parameterised over the context attached to its results and makes no default guarantees about that context: what it contains is entirely decided by the plugin providing the capability — typically a `context.transaction` on successful results.

`ClientWithTransactionSending` now also accepts an optional `TContext` type parameter that flows through to the results of `sendTransaction` and `sendTransactions`. Unlike the signing interface, it defaults to `TransactionPlanResultContextWithSignature` for backward compatibility, so existing usage keeps the required `context.signature` on successful results.
