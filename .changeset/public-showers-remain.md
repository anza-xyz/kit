---
'@solana/signers': major
'@solana/react': major
---

Update the signer API to return Transaction & TransactionWithLifetime

The `modifyAndSignTransactions` function for a `TransactionModifyingSigner` must now return a `Transaction & TransactionWithLifetime & TransactionWithinSizeLimit`. Previously it technically needed to return a type derived from the input `TransactionMessage`, but this wasn't checked.

If you have written a `TransactionModifyingSigner` then you should review the changes to `useWalletAccountTransactionSigner` in the React package for guidance. You may need to use the new `getTransactionLifetimeConstraintFromCompiledTransactionMessage` function to obtain a lifetime for the transaction being returned.

If you are using a `TransactionModifyingSigner` such as `useWalletAccountTransactionSigner`, then you will now receive a transaction with `TransactionWithLifetime` when you would previously have received a type with a lifetime matching the input transaction message. This was never guaranteed to match at runtime, but we incorrectly returned a stronger type than can be guaranteed. You may need to use the new `isTransactionWithBlockhashLifetime` or `isTransactionWithDurableNonceLifetime` functions to check the lifetime type of the returned transaction. For example, if you want to pass it to a function returned by `sendAndConfirmTransactionFactory` then you must use `isTransactionWithBlockhashLifetime` or `assertIsTransactionWithBlockhashLifetime` to check its lifetime first.
