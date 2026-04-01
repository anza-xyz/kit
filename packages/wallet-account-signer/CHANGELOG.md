# @solana/wallet-account-signer

## 6.6.0

### Patch Changes

- Updated dependencies [[`742ffca`](https://github.com/anza-xyz/kit/commit/742ffcaf5304f702334e1f0b2a14cf208ae0ee5f), [`7f02d23`](https://github.com/anza-xyz/kit/commit/7f02d23948cc09e3f0bc70931d845569f1cb38ad), [`0fa54a4`](https://github.com/anza-xyz/kit/commit/0fa54a469937db3989f42afc4248882736f719f5)]:
    - @solana/transactions@6.6.0
    - @solana/transaction-messages@6.6.0
    - @solana/signers@6.6.0
    - @solana/addresses@6.6.0
    - @solana/codecs-core@6.6.0
    - @solana/keys@6.6.0
    - @solana/promises@6.6.0

## 6.5.0

### Patch Changes

- Updated dependencies [[`9e05736`](https://github.com/anza-xyz/kit/commit/9e057365a1a4e350f8a0ccc233b262e09b0134fa)]:
    - @solana/signers@6.5.0
    - @solana/addresses@6.5.0
    - @solana/codecs-core@6.5.0
    - @solana/keys@6.5.0
    - @solana/promises@6.5.0
    - @solana/transaction-messages@6.5.0
    - @solana/transactions@6.5.0

## 6.4.0

### Minor Changes

- [#1368](https://github.com/anza-xyz/kit/pull/1368) [`938ca94`](https://github.com/anza-xyz/kit/commit/938ca9442db414ee6fe736b89288c6d14c97cf5a) Thanks [@dpsi9](https://github.com/dpsi9)! - Add functions to create Kit signers from [Wallet Standard](https://github.com/wallet-standard/wallet-standard) `UiWalletAccount` objects.

    `createSignerFromWalletAccount` returns a `TransactionSigner` that can sign transactions using the `solana:signTransaction` and the `solana:signAndSendTransaction` features. At least one of these must be present in the wallet account. If the `solana:signMessage` feature is available, then this signer is also a `MessageSigner`.

    There are also more specific helpers:
    - `createTransactionSignerFromWalletAccount(account, chain)` returns a `TransactionModifyingSigner` that uses the wallet's `solana:signTransaction` feature.
    - `createTransactionSendingSignerFromWalletAccount(account, chain)` returns a `TransactionSendingSigner` that uses the wallet's `solana:signAndSendTransaction` feature.
    - `createMessageSignerFromWalletAccount(account)` returns a `MessageModifyingSigner` that uses the wallet's `solana:signMessage` feature.

    These enable any wallet-standard wallet to be used as a Kit signer.

### Patch Changes

- Updated dependencies [[`27c3975`](https://github.com/anza-xyz/kit/commit/27c39755f5185e09a194c0b22eac4286f14c552c), [`084e92e`](https://github.com/anza-xyz/kit/commit/084e92e668d41041c6424d616441557560873888)]:
    - @solana/codecs-core@6.4.0
    - @solana/transaction-messages@6.4.0
    - @solana/addresses@6.4.0
    - @solana/keys@6.4.0
    - @solana/signers@6.4.0
    - @solana/transactions@6.4.0
    - @solana/promises@6.4.0

## 6.3.1

## 6.3.0

## 6.2.0

### Minor Changes

- [#1415](https://github.com/anza-xyz/kit/pull/1415) [`587ede3`](https://github.com/anza-xyz/kit/commit/587ede3915eea9b14a1150c71e509b7d0d4b4a6c) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add new `@solana/wallet-account-signer` package that will contain functions for converting from [Wallet Standard](https://github.com/wallet-standard/wallet-standard) accounts on Solana chains, to Kit Signer objects.
