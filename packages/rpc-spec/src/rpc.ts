import { SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD, SolanaError } from '@solana/errors';
import { Callable, Flatten, OverloadImplementations, UnionToIntersection } from '@solana/rpc-spec-types';
import { createReactiveActionStore, ReactiveActionStore } from '@solana/subscribable';

import { RpcApi, RpcPlan } from './rpc-api';
import { RpcTransport } from './rpc-transport';

export type RpcConfig<TRpcMethods, TRpcTransport extends RpcTransport> = Readonly<{
    api: RpcApi<TRpcMethods>;
    transport: TRpcTransport;
}>;

/**
 * An object that exposes all of the functions described by `TRpcMethods`.
 *
 * Calling each method returns a {@link PendingRpcRequest | PendingRpcRequest<TResponse>} where
 * `TResponse` is that method's response type.
 */
export type Rpc<TRpcMethods> = {
    [TMethodName in keyof TRpcMethods]: PendingRpcRequestBuilder<OverloadImplementations<TRpcMethods, TMethodName>>;
};

/**
 * Pending requests are the result of calling a supported method on a {@link Rpc} object. They
 * encapsulate all of the information necessary to make the request without actually making it.
 *
 * Calling the {@link PendingRpcRequest.send | `send(options)`} method on a
 * {@link PendingRpcRequest | PendingRpcRequest<TResponse>} will trigger the request and return a
 * promise for `TResponse`.
 *
 * Calling the {@link PendingRpcRequest.reactiveStore | `reactiveStore()`} method will fire the
 * request and return a {@link ReactiveActionStore} compatible with `useSyncExternalStore`, Svelte
 * stores, and other reactive primitives.
 */
export type PendingRpcRequest<TResponse> = {
    /**
     * Synchronously returns a {@link ReactiveActionStore} that fires the request on construction
     * and holds its lifecycle state. Compatible with `useSyncExternalStore` and other reactive
     * primitives that expect a `{ subscribe, getState }` contract. Call `dispatch()` to re-fire the
     * request (for example after an error), or `reset()` to abort the in-flight call and return to
     * `status: 'idle'`.
     *
     * @example
     * ```ts
     * const store = rpc.getAccountInfo(address).reactiveStore();
     * const state = useSyncExternalStore(store.subscribe, store.getState);
     * if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={store.dispatch} />;
     * if (state.status === 'running' && !state.data) return <Spinner />;
     * return <View data={state.data!} />;
     * ```
     */
    reactiveStore(): ReactiveActionStore<[], TResponse>;
    send(options?: RpcSendOptions): Promise<TResponse>;
};

export type RpcSendOptions = Readonly<{
    /**
     * An optional signal that you can supply when triggering a {@link PendingRpcRequest} that you
     * might later need to abort.
     */
    abortSignal?: AbortSignal;
}>;

type PendingRpcRequestBuilder<TMethodImplementations> = UnionToIntersection<
    Flatten<{
        [P in keyof TMethodImplementations]: PendingRpcRequestReturnTypeMapper<TMethodImplementations[P]>;
    }>
>;

type PendingRpcRequestReturnTypeMapper<TMethodImplementation> =
    // Check that this property of the TRpcMethods interface is, in fact, a function.
    TMethodImplementation extends Callable
        ? (...args: Parameters<TMethodImplementation>) => PendingRpcRequest<ReturnType<TMethodImplementation>>
        : never;

/**
 * Creates a {@link Rpc} instance given a {@link RpcApi | RpcApi<TRpcMethods>} and a
 * {@link RpcTransport} capable of fulfilling them.
 */
export function createRpc<TRpcMethods, TRpcTransport extends RpcTransport>(
    rpcConfig: RpcConfig<TRpcMethods, TRpcTransport>,
): Rpc<TRpcMethods> {
    return makeProxy(rpcConfig);
}

function makeProxy<TRpcMethods, TRpcTransport extends RpcTransport>(
    rpcConfig: RpcConfig<TRpcMethods, TRpcTransport>,
): Rpc<TRpcMethods> {
    return new Proxy(rpcConfig.api, {
        defineProperty() {
            return false;
        },
        deleteProperty() {
            return false;
        },
        get(target, p, receiver) {
            if (p === 'then') {
                return undefined;
            }
            return function (...rawParams: unknown[]) {
                const methodName = p.toString();
                const getApiPlan = Reflect.get(target, methodName, receiver);
                if (!getApiPlan) {
                    throw new SolanaError(SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD, {
                        method: methodName,
                        params: rawParams,
                    });
                }
                const apiPlan = getApiPlan(...rawParams);
                return createPendingRpcRequest(rpcConfig, apiPlan);
            };
        },
    }) as Rpc<TRpcMethods>;
}

function createPendingRpcRequest<TRpcMethods, TRpcTransport extends RpcTransport, TResponse>(
    { transport }: RpcConfig<TRpcMethods, TRpcTransport>,
    plan: RpcPlan<TResponse>,
): PendingRpcRequest<TResponse> {
    return {
        reactiveStore(): ReactiveActionStore<[], TResponse> {
            const store = createReactiveActionStore<[], TResponse>(signal => plan.execute({ signal, transport }));
            store.dispatch();
            return store;
        },
        async send(options?: RpcSendOptions): Promise<TResponse> {
            return await plan.execute({ signal: options?.abortSignal, transport });
        },
    };
}
