import type { SolanaRpcSubscriptionsApi, SolanaRpcSubscriptionsApiUnstable } from '@solana/rpc-subscriptions-api';
import { createSolanaRpcSubscriptionsApi } from '@solana/rpc-subscriptions-api';
import {
    createSubscriptionRpc,
    RpcSubscriptionsApiMethods,
    type RpcSubscriptionsTransport,
} from '@solana/rpc-subscriptions-spec';
import { ClusterUrl } from '@solana/rpc-types';

import { DEFAULT_RPC_SUBSCRIPTIONS_CONFIG } from './rpc-default-config';
import {
    createDefaultSolanaRpcSubscriptionsChannelCreator,
    DefaultRpcSubscriptionsChannelConfig,
} from './rpc-subscriptions-channel';
import type { RpcSubscriptionsFromTransport } from './rpc-subscriptions-clusters';
import { createDefaultRpcSubscriptionsTransport } from './rpc-subscriptions-transport';

type Config<TClusterUrl extends ClusterUrl> = DefaultRpcSubscriptionsChannelConfig<TClusterUrl>;

function createSolanaRpcSubscriptionsImpl<TClusterUrl extends ClusterUrl, TApi extends RpcSubscriptionsApiMethods>(
    clusterUrl: TClusterUrl,
    config?: Omit<Config<TClusterUrl>, 'url'>,
) {
    const transport = createDefaultRpcSubscriptionsTransport({
        createChannel: createDefaultSolanaRpcSubscriptionsChannelCreator({ ...config, url: clusterUrl }),
    });
    return createSolanaRpcSubscriptionsFromTransport<typeof transport, TApi>(transport);
}

/**
 * Creates a {@link RpcSubscriptions} instance that exposes the Solana JSON RPC WebSocket API given
 * a cluster URL and some optional channel config. See
 * {@link createDefaultRpcSubscriptionsChannelCreator} for the shape of the channel config.
 */
export function createSolanaRpcSubscriptions<TClusterUrl extends ClusterUrl>(
    clusterUrl: TClusterUrl,
    config?: Omit<Config<TClusterUrl>, 'url'>,
) {
    return createSolanaRpcSubscriptionsImpl<TClusterUrl, SolanaRpcSubscriptionsApi>(clusterUrl, config);
}

/**
 * Creates a {@link RpcSubscriptions} instance that exposes the Solana JSON RPC WebSocket API,
 * including its unstable methods, given a cluster URL and some optional channel config. See
 * {@link createDefaultRpcSubscriptionsChannelCreator} for the shape of the channel config.
 */
export function createSolanaRpcSubscriptions_UNSTABLE<TClusterUrl extends ClusterUrl>(
    clusterUrl: TClusterUrl,
    config?: Omit<Config<TClusterUrl>, 'url'>,
) {
    return createSolanaRpcSubscriptionsImpl<TClusterUrl, SolanaRpcSubscriptionsApi & SolanaRpcSubscriptionsApiUnstable>(
        clusterUrl,
        config,
    );
}

/**
 * Creates a {@link RpcSubscriptions} instance that exposes the Solana JSON RPC WebSocket API given
 * the supplied {@link RpcSubscriptionsTransport}.
 */
export function createSolanaRpcSubscriptionsFromTransport<
    TTransport extends RpcSubscriptionsTransport,
    TApi extends RpcSubscriptionsApiMethods = SolanaRpcSubscriptionsApi,
>(transport: TTransport) {
    return createSubscriptionRpc({
        api: createSolanaRpcSubscriptionsApi<TApi>(DEFAULT_RPC_SUBSCRIPTIONS_CONFIG),
        transport,
    }) as RpcSubscriptionsFromTransport<TApi, TTransport>;
}
