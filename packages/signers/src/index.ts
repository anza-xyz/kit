/**
 * This package provides an abstraction layer over signing messages and transactions in Solana.
 * It can be used standalone, but it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * You can think of signers as an abstract way to sign messages and transactions.
 * This could be using a {@link CryptoKeyPair}, a wallet adapter in the browser,
 * a Noop signer for testing purposes, or anything you want.
 * Here's an example using a {@link CryptoKeyPair} signer:
 *
 * @example
 * ```ts
 * import { pipe } from '@solana/functional';
 * import { generateKeyPairSigner } from '@solana/signers';
 * import { createTransactionMessage } from '@solana/transaction-messages';
 * import { compileTransaction } from '@solana/transactions';
 *
 * // Generate a key pair signer.
 * const mySigner = await generateKeyPairSigner();
 * mySigner.address; // Address;
 *
 * // Sign one or multiple messages.
 * const myMessage = createSignableMessage('Hello world!');
 * const [messageSignatures] = await mySigner.signMessages([myMessage]);
 *
 * // Sign one or multiple transaction messages.
 * const myTransactionMessage = pipe(
 *     createTransactionMessage({ version: 0 }),
 *     // Add instructions, fee payer, lifetime, etc.
 * );
 * const myTransaction = compileTransaction(myTransactionMessage);
 * const [transactionSignatures] = await mySigner.signTransactions([myTransaction]);
 * ```
 *
 * As you can see, this provides a consistent API regardless of how things are being signed
 * behind the scenes. If tomorrow we need to use a browser wallet instead, we'd simply
 * need to swap the {@link generateKeyPairSigner} function with the signer factory of our choice.
 *
 * @remarks
 * This package offers a total of five different types of signers that may be used in combination when applicable.
 * Three of them allow us to sign transactions whereas the other two are used for regular message signing.
 *
 * They are separated into three categories:
 *
 * - **Partial signers**: Given a message or transaction, provide one or more signatures for it.
 *   These signers are not able to modify the given data which allows us to run many of them in parallel.
 * - **Modifying signers**: Can choose to modify a message or transaction before signing it with zero
 *   or more private keys. Because modifying a message or transaction invalidates any pre-existing
 *   signatures over it, modifying signers must do their work before any other signer.
 * - **Sending signers**: Given a transaction, signs it and sends it immediately to the blockchain.
 *   When applicable, the signer may also decide to modify the provided transaction before signing it.
 *   This interface accommodates wallets that simply cannot sign a transaction without sending it at the same time.
 *   This category of signers does not apply to regular messages.
 *
 * Thus, we end up with the following interfaces.
 *
 * |                     | Partial signers            | Modifying signers            | Sending signers            |
 * | ------------------- | -------------------------- | ---------------------------- | -------------------------- |
 * | {@link TransactionSigner} | {@link TransactionPartialSigner} | {@link TransactionModifyingSigner} | {@link TransactionSendingSigner} |
 * | {@link MessageSigner}     | {@link MessagePartialSigner}     | {@link MessageModifyingSigner}     | N/A                        |
 *
 * This package also provides the following concrete signer implementations:
 *
 * - The {@link KeyPairSigner} which uses a {@link CryptoKeyPair} to sign messages and transactions.
 * - The {@link NoopSigner} which does not sign anything and is mostly useful for testing purposes
 *   or for indicating that an account will be signed in a different environment (e.g. sending a
 *   transaction to your server so it can sign it).
 *
 * Additionally, this package allows {@link TransactionSigner | TransactionSigners} to be stored
 * inside the account meta of an instruction. This allows us to create instructions by passing
 * around signers instead of addresses when applicable which, in turn, allows us to
 * {@link signTransactionMessageWithSigners | sign an entire transaction automatically}
 * without having to scan through its instructions to find the required signers.
 *
 * @packageDocumentation
 */
export * from './account-signer-meta';
export * from './add-signers';
export * from './fee-payer-signer';
export * from './keypair-signer';
export * from './message-modifying-signer';
export * from './message-partial-signer';
export * from './message-signer';
export * from './noop-signer';
export * from './sign-transaction';
export * from './signable-message';
export * from './transaction-modifying-signer';
export * from './transaction-partial-signer';
export * from './transaction-sending-signer';
export * from './transaction-signer';
export * from './transaction-with-single-sending-signer';
export * from './types';
