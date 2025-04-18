import { RpcTransport } from '@solana/rpc-spec';
import { parseJsonWithBigInts, stringifyJsonWithBigints } from '@solana/rpc-spec-types';

import { createHttpTransport } from './http-transport';
import { HttpTransportConfig } from './http-transport-config';
import { isSolanaRequest } from './is-solana-request';

type Config = Pick<HttpTransportConfig, 'dispatcher_NODE_ONLY' | 'headers' | 'url'>;

/**
 * Creates a {@link RpcTransport} that uses JSON HTTP requests — much like the
 * {@link createHttpTransport} function - except that it also uses custom `toJson` and `fromJson`
 * functions in order to allow `bigint` values to be serialized and deserialized correctly over the
 * wire.
 *
 * Since this is something specific to the Solana RPC API, these custom JSON functions are only
 * triggered when the request is recognized as a Solana RPC request. Normal RPC APIs should aim to
 * wrap their `bigint` values — e.g. `u64` or `i64` — in special value objects that represent the
 * number as a string to avoid numerical values going above `Number.MAX_SAFE_INTEGER`.
 *
 * It has the same configuration options as {@link createHttpTransport}, but without the `fromJson`
 * and `toJson` options.
 */
export function createHttpTransportForSolanaRpc(config: Config): RpcTransport {
    return createHttpTransport({
        ...config,
        fromJson: (rawResponse: string, payload: unknown) =>
            isSolanaRequest(payload) ? parseJsonWithBigInts(rawResponse) : JSON.parse(rawResponse),
        toJson: (payload: unknown) =>
            isSolanaRequest(payload) ? stringifyJsonWithBigints(payload) : JSON.stringify(payload),
    });
}
