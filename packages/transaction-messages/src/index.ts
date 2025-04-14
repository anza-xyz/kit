/**
 * This package contains types and functions for creating transaction messages.
 * It can be used standalone, but it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * @example
 * Transaction messages are built one step at a time using the transform functions offered by this
 * package. To make it more ergonomic to apply consecutive transforms to your transaction messages,
 * consider using a pipelining helper like the one in `@solana/functional`.
 *
 * ```ts
 * import { pipe } from '@solana/functional';
 * import {
 *     appendTransactionMessageInstruction,
 *     createTransactionMessage,
 *     setTransactionMessageFeePayer,
 *     setTransactionMessageLifetimeUsingBlockhash,
 * } from '@solana/transaction-messages';
 *
 * const transferTransactionMessage = pipe(
 *     createTransactionMessage({ version: 0 }),
 *     m => setTransactionMessageFeePayer(myAddress, m),
 *     m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
 *     m => appendTransactionMessageInstruction(getTransferSolInstruction({ source, destination, amount }), m),
 * );
 * ```
 *
 * @packageDocumentation
 */
export * from './addresses-by-lookup-table-address';
export * from './blockhash';
export * from './codecs';
export * from './compilable-transaction-message';
export * from './compile';
export * from './compress-transaction-message';
export * from './create-transaction-message';
export * from './decompile-message';
export * from './durable-nonce';
export * from './fee-payer';
export * from './instructions';
export * from './transaction-message';
