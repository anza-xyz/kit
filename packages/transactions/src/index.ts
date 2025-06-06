/**
 * This package contains types and functions for compiling, signing and sending transactions.
 * It can be used standalone, but it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * Transactions are created by compiling a transaction message. They must then be signed before
 * being submitted to the network.
 *
 * @packageDocumentation
 */
export * from './codecs';
export * from './lifetime';
export * from './compile-transaction';
export * from './signatures';
export * from './wire-transaction';
export * from './sendable-transaction';
export * from './transaction-message-size';
export * from './transaction-size';
export * from './transaction';

// Remove in the next major version.
export * from './deprecated';
