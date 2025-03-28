/**
 * This package contains types that implement RPC subscriptions as required by the Solana RPC.
 * Additionally, it incorporates some useful defaults that make working with subscriptions easier,
 * more performant, and more reliable. It can be used standalone, but it is also exported as part of
 * Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * @packageDocumentation
 */
export * from '@solana/rpc-subscriptions-api';
export * from '@solana/rpc-subscriptions-spec';

export * from './rpc-default-config';
export * from './rpc-subscriptions';
export * from './rpc-subscriptions-clusters';
export * from './rpc-subscriptions-json';
export * from './rpc-subscriptions-channel';
export * from './rpc-subscriptions-transport';
