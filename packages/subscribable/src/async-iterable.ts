import {
    SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_MUST_NOT_POLL_BEFORE_RESOLVING_EXISTING_MESSAGE_PROMISE,
    SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_STATE_MISSING,
    SolanaError,
} from '@solana/errors';
import { AbortController } from '@solana/event-target-impl';

import { DataPublisher } from './data-publisher';

type Config = Readonly<{
    /**
     * Triggering this abort signal will cause all iterators spawned from this iterator to return
     * once they have published all queued messages.
     */
    abortSignal: AbortSignal;
    /**
     * Messages from this channel of `dataPublisher` will be the ones yielded through the iterators.
     *
     * Messages only begin to be queued after the first time an iterator begins to poll. Channel
     * messages published before that time will be dropped.
     */
    dataChannelName: string;
    // FIXME: It would be nice to be able to constrain the type of `dataPublisher` to one that
    //        definitely supports the `dataChannelName` and `errorChannelName` channels, and
    //        furthermore publishes `TData` on the `dataChannelName` channel. This is more difficult
    //        than it should be: https://tsplay.dev/NlZelW
    dataPublisher: DataPublisher;
    /**
     * Messages from this channel of `dataPublisher` will be the ones thrown through the iterators.
     *
     * Any new iterators created after the first error is encountered will reject with that error
     * when polled.
     */
    errorChannelName: string;
}>;

const enum PublishType {
    DATA,
    ERROR,
}

type IteratorKey = symbol;
type IteratorState<TData> =
    | {
          __hasPolled: false;
          publishQueue: (
              | {
                    __type: PublishType.DATA;
                    data: TData;
                }
              | {
                    __type: PublishType.ERROR;
                    err: unknown;
                }
          )[];
      }
    | {
          __hasPolled: true;
          onData: (data: TData) => void;
          onError: Parameters<ConstructorParameters<typeof Promise>[0]>[1];
      };

let EXPLICIT_ABORT_TOKEN: symbol;
function createExplicitAbortToken() {
    // This function is an annoying workaround to prevent `process.env.NODE_ENV` from appearing at
    // the top level of this module and thwarting an optimizing compiler's attempt to tree-shake.
    return Symbol(
        __DEV__
            ? "This symbol is thrown from a socket's iterator when the connection is explicitly " +
                  'aborted by the user'
            : undefined,
    );
}

const UNINITIALIZED = Symbol();

/**
 * Returns an `AsyncIterable` given a data publisher.
 *
 * The iterable will produce iterators that vend messages published to `dataChannelName` and will
 * throw the first time a message is published to `errorChannelName`. Triggering the abort signal
 * will cause all iterators spawned from this iterator to return once they have published all queued
 * messages.
 *
 * Things to note:
 *
 * - If a message is published over a channel before the `AsyncIterator` attached to it has polled
 *   for the next result, the message will be queued in memory.
 * - Messages only begin to be queued after the first time an iterator begins to poll. Channel
 *   messages published before that time will be dropped.
 * - If there are messages in the queue and an error occurs, all queued messages will be vended to
 *   the iterator before the error is thrown.
 * - If there are messages in the queue and the abort signal fires, all queued messages will be
 *   vended to the iterator after which it will return.
 * - Any new iterators created after the first error is encountered will reject with that error when
 *   polled.
 *
 * @param config
 *
 * @example
 * ```ts
 * const iterable = createAsyncIterableFromDataPublisher({
 *     abortSignal: AbortSignal.timeout(10_000),
 *     dataChannelName: 'message',
 *     dataPublisher,
 *     errorChannelName: 'error',
 * });
 * try {
 *     for await (const message of iterable) {
 *         console.log('Got message', message);
 *     }
 * } catch (e) {
 *     console.error('An error was published to the error channel', e);
 * } finally {
 *     console.log("It's been 10 seconds; that's enough for now.");
 * }
 * ```
 */
export function createAsyncIterableFromDataPublisher<TData>({
    abortSignal,
    dataChannelName,
    dataPublisher,
    errorChannelName,
}: Config): AsyncIterable<TData> {
    const iteratorState: Map<IteratorKey, IteratorState<TData>> = new Map();
    function publishErrorToAllIterators(reason: unknown) {
        for (const [iteratorKey, state] of iteratorState.entries()) {
            if (state.__hasPolled) {
                iteratorState.delete(iteratorKey);
                state.onError(reason);
            } else {
                state.publishQueue.push({
                    __type: PublishType.ERROR,
                    err: reason,
                });
            }
        }
    }
    const abortController = new AbortController();
    abortSignal.addEventListener('abort', () => {
        abortController.abort();
        publishErrorToAllIterators((EXPLICIT_ABORT_TOKEN ||= createExplicitAbortToken()));
    });
    const options = { signal: abortController.signal } as const;
    let firstError: unknown = UNINITIALIZED;
    dataPublisher.on(
        errorChannelName,
        err => {
            if (firstError === UNINITIALIZED) {
                firstError = err;
                abortController.abort();
                publishErrorToAllIterators(err);
            }
        },
        options,
    );
    dataPublisher.on(
        dataChannelName,
        data => {
            iteratorState.forEach((state, iteratorKey) => {
                if (state.__hasPolled) {
                    const { onData } = state;
                    iteratorState.set(iteratorKey, { __hasPolled: false, publishQueue: [] });
                    onData(data as TData);
                } else {
                    state.publishQueue.push({
                        __type: PublishType.DATA,
                        data: data as TData,
                    });
                }
            });
        },
        options,
    );
    return {
        async *[Symbol.asyncIterator]() {
            if (abortSignal.aborted) {
                return;
            }
            if (firstError !== UNINITIALIZED) {
                throw firstError;
            }
            const iteratorKey = Symbol();
            iteratorState.set(iteratorKey, { __hasPolled: false, publishQueue: [] });
            try {
                while (true) {
                    const state = iteratorState.get(iteratorKey);
                    if (!state) {
                        // There should always be state by now.
                        throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_STATE_MISSING);
                    }
                    if (state.__hasPolled) {
                        // You should never be able to poll twice in a row.
                        throw new SolanaError(
                            SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_MUST_NOT_POLL_BEFORE_RESOLVING_EXISTING_MESSAGE_PROMISE,
                        );
                    }
                    const publishQueue = state.publishQueue;
                    try {
                        if (publishQueue.length) {
                            state.publishQueue = [];
                            for (const item of publishQueue) {
                                if (item.__type === PublishType.DATA) {
                                    yield item.data;
                                } else {
                                    throw item.err;
                                }
                            }
                        } else {
                            yield await new Promise<TData>((resolve, reject) => {
                                iteratorState.set(iteratorKey, {
                                    __hasPolled: true,
                                    onData: resolve,
                                    onError: reject,
                                });
                            });
                        }
                    } catch (e) {
                        if (e === (EXPLICIT_ABORT_TOKEN ||= createExplicitAbortToken())) {
                            return;
                        } else {
                            throw e;
                        }
                    }
                }
            } finally {
                iteratorState.delete(iteratorKey);
            }
        },
    };
}
