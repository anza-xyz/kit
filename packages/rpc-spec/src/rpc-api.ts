import {
    Callable,
    createRpcMessage,
    RpcRequestTransformer,
    RpcResponse,
    RpcResponseTransformer,
} from '@solana/rpc-spec-types';

import type { RpcTransport } from './rpc-transport';

export type RpcApiConfig = Readonly<{
    /**
     * An optional function that transforms the {@link RpcRequest} before it is sent to the JSON RPC
     * server.
     *
     * This is useful when the params supplied by the caller need to be transformed before
     * forwarding the message to the server. Use cases for this include applying defaults,
     * forwarding calls to renamed methods, and serializing complex values.
     */
    requestTransformer?: RpcRequestTransformer;
    /**
     * An optional function that transforms the {@link RpcResponse} before it is returned to the
     * caller.
     *
     * Use cases for this include constructing complex data types from serialized data, and throwing
     * exceptions.
     */
    responseTransformer?: RpcResponseTransformer;
}>;

/**
 * This type allows an {@link RpcApi} to describe how a particular request should be issued to the
 * JSON RPC server.
 *
 * Given a function that was called on a {@link Rpc}, this object exposes an `execute` function that
 * dictates which request will be sent, how the underlying transport will be used, and how the
 * responses will be transformed.
 *
 * This function accepts a {@link RpcTransport} and an `AbortSignal` and asynchronously returns a
 * {@link RpcResponse}. This gives us the opportunity to:
 *
 * - define the `payload` from the requested method name and parameters before passing it to the
 *   transport.
 * - call the underlying transport zero, one or multiple times depending on the use-case (e.g.
 *   caching or aggregating multiple responses).
 * - transform the response from the JSON RPC server, in case it does not match the `TResponse`
 *   specified by the {@link PendingRpcRequest | PendingRpcRequest<TResponse>} returned from that
 *   function.
 */
export type RpcPlan<TResponse> = {
    execute: (
        config: Readonly<{
            signal?: AbortSignal;
            transport: RpcTransport;
        }>,
    ) => Promise<RpcResponse<TResponse>>;
};

/**
 * For each of `TRpcMethods`, this object exposes a method with the same name that maps between its
 * input arguments and a {@link RpcPlan | RpcPlan<TResponse>} that implements the execution of a
 * JSON RPC request to fetch `TResponse`.
 */
export type RpcApi<TRpcMethods> = {
    [MethodName in keyof TRpcMethods]: RpcReturnTypeMapper<TRpcMethods[MethodName]>;
};

type RpcReturnTypeMapper<TRpcMethod> = TRpcMethod extends Callable
    ? (...rawParams: unknown[]) => RpcPlan<ReturnType<TRpcMethod>>
    : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RpcApiMethod = (...args: any) => any;
interface RpcApiMethods {
    [methodName: string]: RpcApiMethod;
}

/**
 * Creates a JavaScript proxy that converts _any_ function call called on it to a {@link RpcPlan} by
 * creating an `execute` function that:
 *
 * - sets the transport payload to a JSON RPC v2 payload object with the requested `methodName` and
 *   `params` properties, optionally transformed by {@link RpcApiConfig.requestTransformer}.
 * - transforms the transport's response using the {@link RpcApiConfig.responseTransformer}
 *   function, if provided.
 *
 * @example
 * ```ts
 * // For example, given this `RpcApi`:
 * const rpcApi = createJsonRpcApi({
 *     requestTransformer: (...rawParams) => rawParams.reverse(),
 *     responseTransformer: response => response.result,
 * });
 *
 * // ...the following function call:
 * rpcApi.foo('bar', { baz: 'bat' });
 *
 * // ...will produce a `RpcPlan` that:
 * // -   Uses the following payload: { id: 1, jsonrpc: '2.0', method: 'foo', params: [{ baz: 'bat' }, 'bar'] }.
 * // -   Returns the "result" property of the RPC response.
 * ```
 */
export function createJsonRpcApi<TRpcMethods extends RpcApiMethods>(config?: RpcApiConfig): RpcApi<TRpcMethods> {
    return new Proxy({} as RpcApi<TRpcMethods>, {
        defineProperty() {
            return false;
        },
        deleteProperty() {
            return false;
        },
        get<TMethodName extends keyof RpcApi<TRpcMethods>>(
            ...args: Parameters<NonNullable<ProxyHandler<RpcApi<TRpcMethods>>['get']>>
        ) {
            const [_, p] = args;
            const methodName = p.toString() as keyof TRpcMethods as string;
            return function (
                ...rawParams: Parameters<
                    TRpcMethods[TMethodName] extends CallableFunction ? TRpcMethods[TMethodName] : never
                >
            ): RpcPlan<ReturnType<TRpcMethods[TMethodName]>> {
                const rawRequest = Object.freeze({ methodName, params: rawParams });
                const request = config?.requestTransformer ? config?.requestTransformer(rawRequest) : rawRequest;
                return Object.freeze(<RpcPlan<ReturnType<TRpcMethods[TMethodName]>>>{
                    execute: async ({ signal, transport }) => {
                        const payload = createRpcMessage(request);
                        const response = await transport({ payload, signal });
                        if (!config?.responseTransformer) {
                            return response;
                        }
                        return config.responseTransformer(response, request);
                    },
                });
            };
        },
    });
}
