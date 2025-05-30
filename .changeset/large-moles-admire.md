---
'@solana/programs': patch
---

Fixed a bug with `isProgramError` that gives accurate results for errors produced after the introduction of `solana-transaction-error` 3.0.0 to validator clients, and eliminates the need to supply the original transaction message. Please remove `transactionMessage` from the list of arguments now, as it will be removed in `@solana/kit` 4.0.0.
