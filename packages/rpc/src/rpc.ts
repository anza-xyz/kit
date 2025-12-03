import { createSolanaRpcApi } from '@solana/rpc-api';
import { createRpc, RpcTransport } from '@solana/rpc-spec';
import { ClusterUrl } from '@solana/rpc-types';

import type { RpcFromTransport, SolanaRpcApiFromTransport } from './rpc-clusters';
import { DEFAULT_RPC_CONFIG } from './rpc-default-config';
import { createDefaultRpcTransport } from './rpc-transport';

type DefaultRpcTransportConfig<TClusterUrl extends ClusterUrl> = Parameters<
    typeof createDefaultRpcTransport<TClusterUrl>
>[0];

/**
 * Creates a {@link Rpc} instance that exposes the Solana JSON RPC API given a cluster URL and some
 * optional transport config. See {@link createDefaultRpcTransport} for the shape of the transport
 * config.
 */
export function createSolanaRpc<TClusterUrl extends ClusterUrl>(
    clusterUrl: TClusterUrl,
    config?: Omit<DefaultRpcTransportConfig<TClusterUrl>, 'url'>,
) {
    return createSolanaRpcFromTransport(createDefaultRpcTransport({ url: clusterUrl, ...config }));
}

/**
 * Creates a {@link Rpc} instance that exposes the Solana JSON RPC API given the supplied
 * {@link RpcTransport}.
 */
export function createSolanaRpcFromTransport<TTransport extends RpcTransport>(transport: TTransport) {
    return createRpc({
        api: createSolanaRpcApi(DEFAULT_RPC_CONFIG),
        transport,
    }) as RpcFromTransport<SolanaRpcApiFromTransport<TTransport>, TTransport>;
}
