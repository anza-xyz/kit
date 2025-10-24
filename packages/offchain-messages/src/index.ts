/**
 * This package contains utilities for encoding and decoding messages according to the offchain
 * message [specification](https://github.com/anza-xyz/agave/blob/master/docs/src/proposals/off-chain-message-signing.md).
 * It can be used standalone, but it is also exported as part of Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * @packageDocumentation
 */
export * from './codecs/application-domain';
export * from './codecs/envelope';
export * from './codecs/message-v0';
export * from './codecs/message';
export * from './application-domain';
export * from './content';
export * from './envelope';
export * from './message-v0';
export * from './message';
export * from './signatures';
export * from './version';
