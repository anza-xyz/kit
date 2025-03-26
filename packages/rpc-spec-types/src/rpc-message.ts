import { RpcRequest } from './rpc-request';

let _nextMessageId = 0n;
function getNextMessageId(): string {
    const id = _nextMessageId;
    _nextMessageId++;
    return id.toString();
}

/**
 * Returns a spec-compliant JSON RPC 2.0 message, given a method name and some params.
 *
 * Generates a new `id` on each call by incrementing a `bigint` and casting it to a string.
 */
export function createRpcMessage<TParams>(request: RpcRequest<TParams>) {
    return {
        id: getNextMessageId(),
        jsonrpc: '2.0',
        method: request.methodName,
        params: request.params,
    };
}
