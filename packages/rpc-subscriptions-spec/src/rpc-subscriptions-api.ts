import { Callable, RpcRequest, RpcRequestTransformer } from '@solana/rpc-spec-types';
import { DataPublisher } from '@solana/subscribable';

import { RpcSubscriptionsChannel } from './rpc-subscriptions-channel';
import { RpcSubscriptionsTransportDataEvents } from './rpc-subscriptions-transport';

export type RpcSubscriptionsApiConfig<TApiMethods extends RpcSubscriptionsApiMethods> = Readonly<{
    planExecutor: RpcSubscriptionsPlanExecutor<ReturnType<TApiMethods[keyof TApiMethods]>>;
    /**
     * An optional function that transforms the {@link RpcRequest} before it is sent to the JSON RPC
     * server.
     *
     * This is useful when the params supplied by the caller need to be transformed before
     * forwarding the message to the server. Use cases for this include applying defaults,
     * forwarding calls to renamed methods, and serializing complex values.
     */
    requestTransformer?: RpcRequestTransformer;
}>;

/**
 * A function that implements a protocol for subscribing and unsubscribing from notifications given
 * a {@link RpcSubscriptionsChannel}, a {@link RpcRequest}, and an `AbortSignal`.
 *
 * @returns A {@link DataPublisher} that emits {@link RpcSubscriptionsTransportDataEvents}
 */
type RpcSubscriptionsPlanExecutor<TNotification> = (
    config: Readonly<{
        channel: RpcSubscriptionsChannel<unknown, unknown>;
        request: RpcRequest;
        signal: AbortSignal;
    }>,
) => Promise<DataPublisher<RpcSubscriptionsTransportDataEvents<TNotification>>>;

/**
 * This type allows an {@link RpcSubscriptionsApi} to describe how a particular subscription should
 * be issued to the JSON RPC server.
 *
 * Given a function that was called on a {@link RpcSubscriptions}, this object exposes an `execute`
 * function that dictates which subscription request will be sent, how the underlying transport will
 * be used, and how the notifications will be transformed.
 *
 * This function accepts a {@link RpcSubscriptionsChannel} and an `AbortSignal` and asynchronously
 * returns a {@link DataPublisher}. This gives us the opportunity to:
 *
 * - define the `payload` from the requested method name and parameters before passing it to the
 *   channel.
 * - call the underlying channel zero, one or multiple times depending on the use-case (e.g.
 *   caching or coalescing multiple subscriptions).
 * - transform the notification from the JSON RPC server, in case it does not match the
 *   `TNotification` specified by the
 *   {@link PendingRpcSubscriptionsRequest | PendingRpcSubscriptionsRequest<TNotification>} emitted
 *   from the publisher returned.
 */
export type RpcSubscriptionsPlan<TNotification> = Readonly<{
    /**
     * This method may be called with a newly-opened channel or a pre-established channel.
     */
    execute: (
        config: Readonly<{
            channel: RpcSubscriptionsChannel<unknown, unknown>;
            signal: AbortSignal;
        }>,
    ) => Promise<DataPublisher<RpcSubscriptionsTransportDataEvents<TNotification>>>;
    /**
     * This request is used to uniquely identify the subscription.
     * It typically comes from the method name and parameters of the subscription call,
     * after potentially being transformed by the RPC Subscriptions API.
     */
    request: RpcRequest;
}>;

/**
 * For each of `TRpcSubscriptionsMethods`, this object exposes a method with the same name that maps
 * between its input arguments and a
 * {@link RpcSubscriptionsPlan | RpcSubscriptionsPlan<TNotification>} that implements the execution
 * of a JSON RPC subscription for `TNotifications`.
 */
export type RpcSubscriptionsApi<TRpcSubscriptionMethods> = {
    [MethodName in keyof TRpcSubscriptionMethods]: RpcSubscriptionsReturnTypeMapper<
        TRpcSubscriptionMethods[MethodName]
    >;
};

type RpcSubscriptionsReturnTypeMapper<TRpcMethod> = TRpcMethod extends Callable
    ? (...rawParams: unknown[]) => RpcSubscriptionsPlan<ReturnType<TRpcMethod>>
    : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RpcSubscriptionsApiMethod = (...args: any) => any;
export interface RpcSubscriptionsApiMethods {
    [methodName: string]: RpcSubscriptionsApiMethod;
}

/**
 * Creates a JavaScript proxy that converts _any_ function call called on it to a
 * {@link RpcSubscriptionsPlan} by creating an `execute` function that:
 *
 * - calls the supplied {@link RpcSubscriptionsApiConfig.planExecutor} with a JSON RPC v2 payload
 *   object with the requested `methodName` and `params` properties, optionally transformed by
 *   {@link RpcSubscriptionsApiConfig.requestTransformer}.
 *
 * @example
 * ```ts
 * // For example, given this `RpcSubscriptionsApi`:
 * const rpcSubscriptionsApi = createJsonRpcSubscriptionsApi({
 *     async planExecutor({ channel, request }) {
 *         await channel.send(request);
 *         return {
 *             ...channel,
 *             on(type, listener, options) {
 *                 if (type !== 'message') {
 *                     return channel.on(type, listener, options);
 *                 }
 *                 return channel.on(
 *                     'message',
 *                     function resultGettingListener(message) {
 *                         listener(message.result);
 *                     },
 *                     options,
 *                 );
 *             }
 *         }
 *     },
 *     requestTransformer: (...rawParams) => rawParams.reverse(),
 * });
 *
 * // ...the following function call:
 * rpcSubscriptionsApi.foo('bar', { baz: 'bat' });
 *
 * // ...will produce a `RpcSubscriptionsPlan` that:
 * // -   Uses the following payload: { id: 1, jsonrpc: '2.0', method: 'foo', params: [{ baz: 'bat' }, 'bar'] }.
 * // -   Emits the "result" property of each RPC Subscriptions message.
 * ```
 */
export function createRpcSubscriptionsApi<TRpcSubscriptionsApiMethods extends RpcSubscriptionsApiMethods>(
    config: RpcSubscriptionsApiConfig<TRpcSubscriptionsApiMethods>,
): RpcSubscriptionsApi<TRpcSubscriptionsApiMethods> {
    return new Proxy({} as RpcSubscriptionsApi<TRpcSubscriptionsApiMethods>, {
        defineProperty() {
            return false;
        },
        deleteProperty() {
            return false;
        },
        get<TNotificationName extends keyof RpcSubscriptionsApi<TRpcSubscriptionsApiMethods>>(
            ...args: Parameters<NonNullable<ProxyHandler<RpcSubscriptionsApi<TRpcSubscriptionsApiMethods>>['get']>>
        ) {
            const [_, p] = args;
            const methodName = p.toString() as keyof TRpcSubscriptionsApiMethods as string;
            return function (
                ...params: Parameters<
                    TRpcSubscriptionsApiMethods[TNotificationName] extends CallableFunction
                        ? TRpcSubscriptionsApiMethods[TNotificationName]
                        : never
                >
            ): RpcSubscriptionsPlan<ReturnType<TRpcSubscriptionsApiMethods[TNotificationName]>> {
                const rawRequest = { methodName, params };
                const request = config.requestTransformer ? config.requestTransformer(rawRequest) : rawRequest;
                return {
                    execute(planConfig) {
                        return config.planExecutor({ ...planConfig, request });
                    },
                    request,
                };
            };
        },
    });
}
