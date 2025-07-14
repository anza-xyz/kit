---
'@solana/transactions': major
'@solana/signers': major
---

Add the `TransactionWithLifetime` requirement when signing transactions. This is because, whilst a lifetime may not always be required before compile a transaction message, it is always required when signing a transaction. Otherwise, the transaction signatures will be invalid when one is added later.
