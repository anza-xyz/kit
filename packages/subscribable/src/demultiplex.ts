import { EventTarget } from '@solana/event-target-impl';

import { DataPublisher, getDataPublisherFromEventEmitter } from './data-publisher';

/**
 * Given a channel that carries messages for multiple subscribers on a single channel name, this
 * function returns a new {@link DataPublisher} that splits them into multiple channel names.
 *
 * @param messageTransformer A function that receives the message as the first argument, and returns
 * a tuple of the derived channel name and the message.
 *
 * @example
 * Imagine a channel that carries multiple notifications whose destination is contained within the
 * message itself.
 *
 * ```ts
 * const demuxedDataPublisher = demultiplexDataPublisher(channel, 'message', message => {
 *     const destinationChannelName = `notification-for:${message.subscriberId}`;
 *     return [destinationChannelName, message];
 * });
 * ```
 *
 * Now you can subscribe to _only_ the messages you are interested in, without having to subscribe
 * to the entire `'message'` channel and filter out the messages that are not for you.
 *
 * ```ts
 * demuxedDataPublisher.on(
 *     'notification-for:123',
 *     message => {
 *         console.log('Got a message for subscriber 123', message);
 *     },
 *     { signal: AbortSignal.timeout(5_000) },
 * );
 * ```
 */
export function demultiplexDataPublisher<
    TDataPublisher extends DataPublisher,
    const TChannelName extends Parameters<TDataPublisher['on']>[0],
>(
    publisher: TDataPublisher,
    sourceChannelName: TChannelName,
    messageTransformer: (
        // FIXME: Deriving the type of the message from `TDataPublisher` and `TChannelName` would
        //        help callers to constrain their transform functions.
        message: unknown,
    ) => [destinationChannelName: string, message: unknown] | void,
): DataPublisher {
    let innerPublisherState:
        | {
              readonly dispose: () => void;
              numSubscribers: number;
          }
        | undefined;
    const eventTarget = new EventTarget();
    const demultiplexedDataPublisher = getDataPublisherFromEventEmitter(eventTarget);
    return {
        ...demultiplexedDataPublisher,
        on(channelName, subscriber, options) {
            if (!innerPublisherState) {
                const innerPublisherUnsubscribe = publisher.on(sourceChannelName, sourceMessage => {
                    const transformResult = messageTransformer(sourceMessage);
                    if (!transformResult) {
                        return;
                    }
                    const [destinationChannelName, message] = transformResult;
                    eventTarget.dispatchEvent(
                        new CustomEvent(destinationChannelName, {
                            detail: message,
                        }),
                    );
                });
                innerPublisherState = {
                    dispose: innerPublisherUnsubscribe,
                    numSubscribers: 0,
                };
            }
            innerPublisherState.numSubscribers++;
            const unsubscribe = demultiplexedDataPublisher.on(channelName, subscriber, options);
            let isActive = true;
            function handleUnsubscribe() {
                if (!isActive) {
                    return;
                }
                isActive = false;
                options?.signal.removeEventListener('abort', handleUnsubscribe);
                innerPublisherState!.numSubscribers--;
                if (innerPublisherState!.numSubscribers === 0) {
                    innerPublisherState!.dispose();
                    innerPublisherState = undefined;
                }
                unsubscribe();
            }
            options?.signal.addEventListener('abort', handleUnsubscribe);
            return handleUnsubscribe;
        },
    };
}
