import type { RpcRequest } from './rpc-request';

/**
 * Represents the response from a RPC server.
 *
 * This could be any sort of data which is why {@link RpcResponse} defaults to `unknown`. You may
 * use a type parameter to specify the shape of the response — e.g.
 * `RpcResponse<{ result: number }>`.
 */
export type RpcResponse<TResponse = unknown> = TResponse;

/**
 * A function that accepts a {@link RpcResponse} and returns another {@link RpcResponse}.
 *
 * This allows the {@link RpcApi} to transform the response before it is returned to the caller.
 */
export type RpcResponseTransformer<TResponse = unknown> = {
    (response: RpcResponse, request: RpcRequest): RpcResponse<TResponse>;
};

interface IHasIdentifier {
    readonly id: string;
}

type RpcErrorResponsePayload = Readonly<{
    code: number;
    data?: unknown;
    message: string;
}>;

export type RpcResponseData<TResponse> = IHasIdentifier &
    Readonly<{ error: RpcErrorResponsePayload } | { result: TResponse }>;
