import { AbortController } from '@solana/event-target-impl';
import fastStableStringify from '@solana/fast-stable-stringify';
import { RpcSubscriptionsTransport } from '@solana/rpc-subscriptions-spec';
import { DataPublisher } from '@solana/subscribable';

type CacheEntry = {
    readonly abortController: AbortController;
    readonly dataPublisherPromise: Promise<DataPublisher>;
    numSubscribers: number;
};

/**
 * Given a {@link RpcSubscriptionsTransport}, will return a new transport that coalesces identical
 * subscriptions into a single subscription request to the server. The determination of whether a
 * subscription is the same as another is based on the `rpcRequest` returned by its
 * {@link RpcSubscriptionsPlan}. The subscription will only be aborted once all subscribers abort,
 * or there is an error.
 */
export function getRpcSubscriptionsTransportWithSubscriptionCoalescing<TTransport extends RpcSubscriptionsTransport>(
    transport: TTransport,
): TTransport {
    const cache = new Map<string, CacheEntry>();
    return function rpcSubscriptionsTransportWithSubscriptionCoalescing(config) {
        const { request, signal } = config;
        const subscriptionConfigurationHash = fastStableStringify([request.methodName, request.params]);

        let cachedDataPublisherPromise = cache.get(subscriptionConfigurationHash);
        if (!cachedDataPublisherPromise) {
            const abortController = new AbortController();
            const dataPublisherPromise = transport({
                ...config,
                signal: abortController.signal,
            });
            const cacheEntry = (cachedDataPublisherPromise = {
                abortController,
                dataPublisherPromise,
                numSubscribers: 0,
            });
            cache.set(subscriptionConfigurationHash, cacheEntry);
            dataPublisherPromise
                .then(
                    dataPublisher => {
                        dataPublisher.on(
                            'error',
                            () => {
                                cache.delete(subscriptionConfigurationHash);
                                abortController.abort();
                            },
                            { signal: abortController.signal },
                        );
                    },
                    // This rejection handler is attached directly to `dataPublisherPromise` (rather
                    // than via a trailing `.catch`) so that it is the first reaction to run. That
                    // way the entry is already evicted by the time any subscriber's own rejection
                    // handler runs, and a subscriber that retries from inside it re-dials.
                    () => {
                        // If the transport rejected outright (eg. the WebSocket failed to connect)
                        // the data publisher above will never exist to emit an `error` event, so
                        // evict the entry here; otherwise every future identical subscription would
                        // receive this same cached rejection without ever re-dialing the server.
                        // Aborting also detaches the subscriber abort listeners below, so a late
                        // abort from one of this attempt's subscribers can't cancel a replacement
                        // entry.
                        //
                        // Only evict if the cache still holds *this* entry. If all of its
                        // subscribers aborted while the dial was pending, the entry has already
                        // been evicted (and its controller aborted), and a newer entry may now live
                        // at this hash. A late rejection must not evict that one.
                        if (cache.get(subscriptionConfigurationHash) === cacheEntry) {
                            cache.delete(subscriptionConfigurationHash);
                            abortController.abort();
                        }
                    },
                )
                .catch(() => {});
        }
        cachedDataPublisherPromise.numSubscribers++;
        signal.addEventListener(
            'abort',
            () => {
                cachedDataPublisherPromise.numSubscribers--;
                if (cachedDataPublisherPromise.numSubscribers === 0) {
                    queueMicrotask(() => {
                        if (cachedDataPublisherPromise.numSubscribers === 0) {
                            cache.delete(subscriptionConfigurationHash);
                            cachedDataPublisherPromise.abortController.abort();
                        }
                    });
                }
            },
            { signal: cachedDataPublisherPromise.abortController.signal },
        );
        return cachedDataPublisherPromise.dataPublisherPromise;
    } as TTransport;
}
