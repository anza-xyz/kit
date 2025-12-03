import { pipe } from '@solana/functional';
import { createHttpTransport, createHttpTransportForSolanaRpc } from '@solana/rpc-transport-http';
import type { ClusterUrl } from '@solana/rpc-types';

import { RpcTransportFromClusterUrl } from './rpc-clusters';
import { getRpcTransportWithRequestCoalescing } from './rpc-request-coalescer';
import { getSolanaRpcPayloadDeduplicationKey } from './rpc-request-deduplication';

type RpcTransportConfig = Parameters<typeof createHttpTransport>[0];
interface DefaultRpcTransportConfig<TClusterUrl extends ClusterUrl> extends RpcTransportConfig {
    url: TClusterUrl;
}

function normalizeHeaders<T extends Record<string, string>>(
    headers: T,
): { [K in string & keyof T as Lowercase<K>]: T[K] } {
    const out: Record<string, string> = {};
    for (const headerName in headers) {
        // Lowercasing header names makes it easier to override user-supplied headers.
        out[headerName.toLowerCase()] = headers[headerName];
    }
    return out as { [K in string & keyof T as Lowercase<K>]: T[K] };
}

/**
 * Creates a {@link RpcTransport} with some default behaviours.
 *
 * The default behaviours include:
 * - An automatically-set `Solana-Client` request header, containing the version of `@solana/kit`
 * - Logic that coalesces multiple calls in the same runloop, for the same methods with the same
 *   arguments, into a single network request.
 * - [node-only] An automatically-set `Accept-Encoding` request header asking the server to compress
 *   responses
 *
 * @param config
 */
export function createDefaultRpcTransport<TClusterUrl extends ClusterUrl>(
    config: DefaultRpcTransportConfig<TClusterUrl>,
): RpcTransportFromClusterUrl<TClusterUrl> {
    return pipe(
        createHttpTransportForSolanaRpc({
            ...config,
            headers: {
                ...(__NODEJS__ &&
                    ({
                        // Keep these headers lowercase so they will be overridden by any user-supplied headers below.
                        'accept-encoding':
                            // Natively supported by Node LTS v20.18.0 and above.
                            'br,gzip,deflate', // Brotli, gzip, and Deflate, in that order.
                    } as { [overrideHeader: string]: string })),
                ...(config.headers ? normalizeHeaders(config.headers) : undefined),
                ...({
                    // Keep these headers lowercase so they will override any user-supplied headers above.
                    'solana-client': __VERSION__ ? `js/${__VERSION__}` : 'UNKNOWN',
                } as { [overrideHeader: string]: string }),
            },
        }) as RpcTransportFromClusterUrl<TClusterUrl>,
        transport => getRpcTransportWithRequestCoalescing(transport, getSolanaRpcPayloadDeduplicationKey),
    );
}
