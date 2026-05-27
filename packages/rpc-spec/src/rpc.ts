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
 * Calling the {@link PendingRpcRequest.reactiveStore | `reactiveStore()`} method will return a
 * {@link ReactiveActionStore} compatible with `useSyncExternalStore`, Svelte stores, and other
 * reactive primitives. The store is returned in the `idle` state — call `dispatch()` to fire the
 * request.
 */
export type PendingRpcRequest<TResponse> = {
    /**
     * Synchronously returns a {@link ReactiveActionStore} in the `idle` state, ready to dispatch
     * the underlying request. Compatible with `useSyncExternalStore` and other reactive primitives
     * that expect a `{ subscribe, getState }` contract. Call `dispatch()` to fire the request
     * (again on retry), or `reset()` to abort the in-flight call and return to `status: 'idle'`.
     *
     * Unlike {@link PendingRpcRequest.send}, this method does not fire the request on creation —
     * the caller is responsible for dispatching. This makes signal handling uniform: attach a
     * caller-provided cancellation source per dispatch via
     * `store.withSignal(signal).dispatch(...)`.
     *
     * @example
     * ```ts
     * const store = rpc.getAccountInfo(address).reactiveStore();
     * store.withSignal(AbortSignal.timeout(5_000)).dispatch(); // fire with a per-attempt timeout
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

/**
 * Structural duck-type for anything fireable via `send({ abortSignal })`. Satisfied by
 * {@link PendingRpcRequest | PendingRpcRequest<TResponse>}.
 *
 * @typeParam TResponse - The value `send()` resolves to.
 */
export type RpcSendable<TResponse> = {
    send(options?: RpcSendOptions): Promise<TResponse>;
};

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
            return createReactiveActionStore<[], TResponse>(signal => plan.execute({ signal, transport }));
        },
        async send(options?: RpcSendOptions): Promise<TResponse> {
            return await plan.execute({ signal: options?.abortSignal, transport });
        },
    };
}
