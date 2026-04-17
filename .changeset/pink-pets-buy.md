---
'@solana/wallet-account-signer': patch
---

Widen the `chain` parameter on `createSignerFromWalletAccount`, `createTransactionSignerFromWalletAccount`, and `createTransactionSendingSignerFromWalletAccount` from `SolanaChain` to `SolanaChain | (IdentifierString & {})`. The known Solana chain identifiers continue to autocomplete, but any Wallet Standard `${namespace}:${reference}` value is now also accepted, matching the underlying `solana:signTransaction` and `solana:signAndSendTransaction` feature inputs.
