/**
 * This package contains utilities for creating objects that you can use to communicate with a
 * Solana JSON RPC server. It can be used standalone, but it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * Unless you plan to create a custom RPC interface, you can use the
 * {@link createSolanaRpc} function to obtain a default implementation of the
 * [Solana JSON RPC API](https://solana.com/docs/rpc/http).
 *
 * @packageDocumentation
 */
export * from '@solana/rpc-api';
export * from '@solana/rpc-spec';

export * from './rpc';
export * from './rpc-default-config';
export * from './rpc-clusters';
export * from './rpc-transport';
