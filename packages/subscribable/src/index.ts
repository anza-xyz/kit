/**
 * This package contains utilities for creating subscription-based event targets. These differ from
 * the `EventTarget` interface in that the method you use to add a listener returns an unsubscribe
 * function. It is primarily intended for internal use -- particularly for those building
 * {@link RpcSubscriptionChannel | RpcSubscriptionChannels} and associated infrastructure.
 *
 * @packageDocumentation
 */
export * from './async-iterable';
export * from './data-publisher';
export * from './demultiplex';
export * from './event-emitter';
