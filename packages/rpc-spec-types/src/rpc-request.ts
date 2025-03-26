/**
 * Describes the elements of a {@link Rpc} or {@link RpcSubscriptions} request.
 */
export type RpcRequest<TParams = unknown> = {
    /** Rhe name of the RPC method or subscription requested */
    readonly methodName: string;
    /** The parameters to be passed to the RPC server */
    readonly params: TParams;
};

/**
 * A function that accepts a {@link RpcRequest} and returns another {@link RpcRequest}.
 *
 * This allows the {@link RpcApi} to transform the request before it is sent to the RPC server.
 */
export type RpcRequestTransformer = {
    <TParams>(request: RpcRequest<TParams>): RpcRequest;
};
