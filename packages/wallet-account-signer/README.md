[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/wallet-account-signer?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/wallet-account-signer?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/wallet-account-signer

# @solana/wallet-account-signer

This package bridges [Wallet Standard](https://github.com/wallet-standard/wallet-standard) accounts to Kit [`@solana/signers`](https://github.com/anza-xyz/kit/tree/main/packages/signers) interfaces. It converts a `UiWalletAccount` into the appropriate Kit signer depending on which Wallet Standard features the wallet supports.

## Installation

```shell
pnpm add @solana/wallet-account-signer
```

## Chains

Several functions in this package require a `chain` parameter. The known Solana chains from `@solana/wallet-standard-chains` are autocompleted:

- `'solana:mainnet'`
- `'solana:devnet'`
- `'solana:testnet'`
- `'solana:localnet'`

Any other Wallet Standard `IdentifierString` (i.e. any `${namespace}:${reference}` value) is also accepted to support wallets that advertise non-standard chains.

## Usage

### `createSignerFromWalletAccount(uiWalletAccount, chain)`

Creates a signer that exposes every signing capability the wallet account supports. Inspects the account's features at call time and returns a frozen object with the applicable methods:

- `modifyAndSignTransactions` — when `solana:signTransaction` is available.
- `signAndSendTransactions` — when `solana:signAndSendTransaction` is available.
- `modifyAndSignMessages` — when `solana:signMessage` is available.

At least one transaction-signing feature must be present or an error is thrown.

```ts
import { createSignerFromWalletAccount } from '@solana/wallet-account-signer';

const signer = createSignerFromWalletAccount(walletAccount, 'solana:mainnet');
```

### `createTransactionSignerFromWalletAccount(uiWalletAccount, chain)`

Creates a `TransactionModifyingSigner` from a wallet account that supports the `solana:signTransaction` feature.

```ts
import { createTransactionSignerFromWalletAccount } from '@solana/wallet-account-signer';

const signer = createTransactionSignerFromWalletAccount(walletAccount, 'solana:devnet');
const [signedTransaction] = await signer.modifyAndSignTransactions([transaction]);
```

### `createTransactionSendingSignerFromWalletAccount(uiWalletAccount, chain)`

Creates a `TransactionSendingSigner` from a wallet account that supports the `solana:signAndSendTransaction` feature.

```ts
import { createTransactionSendingSignerFromWalletAccount } from '@solana/wallet-account-signer';

const signer = createTransactionSendingSignerFromWalletAccount(walletAccount, 'solana:devnet');
const [signature] = await signer.signAndSendTransactions([transaction]);
```

### `createMessageSignerFromWalletAccount(uiWalletAccount)`

Creates a `MessageModifyingSigner` from a wallet account that supports the `solana:signMessage` feature. Unlike the transaction signers, this function does not require a `chain` parameter.

```ts
import { createMessageSignerFromWalletAccount } from '@solana/wallet-account-signer';
import { createSignableMessage } from '@solana/signers';

const signer = createMessageSignerFromWalletAccount(walletAccount);
const message = createSignableMessage('Hello, world!');
const [signedMessage] = await signer.modifyAndSignMessages([message]);
```

To learn more about the different signer types, see the [Signers](https://www.solanakit.com/docs/concepts/signers) documentation.
