/**
 * This package contains utilities for encoding and decoding messages according to the offchain
 * message [specification](https://github.com/solana-foundation/SRFCs/discussions/3).
 * It can be used standalone, but it is also exported as part of Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * @packageDocumentation
 */
export * from './application-domain';
export * from './codecs/application-domain';
export * from './codecs/envelope';
export * from './codecs/message';
export * from './codecs/message-v0';
export * from './content';
export * from './envelope';
export * from './envelope-v0';
export * from './message';
export * from './message-v0';
export * from './signatures';
export * from './version';
