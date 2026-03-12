---
'@solana/wallet-account-signer': minor
---

Add functions to create Kit signers from [Wallet Standard](https://github.com/wallet-standard/wallet-standard) `UiWalletAccount` objects. 

- `createTransactionSignerFromWalletAccount(account, chain)` returns a `TransactionModifyingSigner` that uses the wallet's `solana:signTransaction` feature.

- `createTransactionSendingSignerFromWalletAccount(account, chain)` returns a `TransactionSendingSigner` that uses the wallet's `solana:signAndSendTransaction` feature.

- `createMessageSignerFromWalletAccount(account)` returns a `MessageModifyingSigner` that uses the wallet's `solana:signMessage` feature.

These enable any wallet-standard wallet to be used as a Kit signer.
