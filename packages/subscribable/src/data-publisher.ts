import { TypedEventEmitter, TypedEventTarget } from './event-emitter';

type UnsubscribeFn = () => void;

/**
 * Represents an object with an `on` function that you can call to subscribe to certain data over a
 * named channel.
 *
 * @example
 * ```ts
 * let dataPublisher: DataPublisher<{ error: SolanaError }>;
 * dataPublisher.on('data', handleData); // ERROR. `data` is not a known channel name.
 * dataPublisher.on('error', e => {
 *     console.error(e);
 * }); // OK.
 * ```
 */
export interface DataPublisher<TDataByChannelName extends Record<string, unknown> = Record<string, unknown>> {
    /**
     * Call this to subscribe to data over a named channel.
     *
     * @param channelName The name of the channel on which to subscribe for messages
     * @param subscriber The function to call when a message becomes available
     * @param options.signal An abort signal you can fire to unsubscribe
     *
     * @returns A function that you can call to unsubscribe
     */
    on<const TChannelName extends keyof TDataByChannelName>(
        channelName: TChannelName,
        subscriber: (data: TDataByChannelName[TChannelName]) => void,
        options?: { signal: AbortSignal },
    ): UnsubscribeFn;
}

/**
 * Returns an object with an `on` function that you can call to subscribe to certain data over a
 * named channel.
 *
 * The `on` function returns an unsubscribe function.
 *
 * @example
 * ```ts
 * const socketDataPublisher = getDataPublisherFromEventEmitter(new WebSocket('wss://api.devnet.solana.com'));
 * const unsubscribe = socketDataPublisher.on('message', message => {
 *     if (JSON.parse(message.data).id === 42) {
 *         console.log('Got response 42');
 *         unsubscribe();
 *     }
 * });
 * ```
 */
export function getDataPublisherFromEventEmitter<TEventMap extends Record<string, Event>>(
    eventEmitter: TypedEventEmitter<TEventMap> | TypedEventTarget<TEventMap>,
): DataPublisher<{
    [TEventType in keyof TEventMap]: TEventMap[TEventType] extends CustomEvent ? TEventMap[TEventType]['detail'] : null;
}> {
    return {
        on(channelName, subscriber, options) {
            function innerListener(ev: Event) {
                if (ev instanceof CustomEvent) {
                    const data = (ev as CustomEvent<TEventMap[typeof channelName]>).detail;
                    (subscriber as unknown as (data: TEventMap[typeof channelName]) => void)(data);
                } else {
                    (subscriber as () => void)();
                }
            }
            eventEmitter.addEventListener(channelName, innerListener, options);
            return () => {
                eventEmitter.removeEventListener(channelName, innerListener);
            };
        },
    };
}
