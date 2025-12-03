import { createWebSocketChannel } from '@solana/rpc-subscriptions-channel-websocket';
import type { RpcSubscriptionsChannel } from '@solana/rpc-subscriptions-spec';
import type { ClusterUrl } from '@solana/rpc-types';

import { getRpcSubscriptionsChannelWithAutoping } from './rpc-subscriptions-autopinger';
import { getChannelPoolingChannelCreator } from './rpc-subscriptions-channel-pool';
import { RpcSubscriptionsChannelCreatorFromClusterUrl } from './rpc-subscriptions-clusters';
import { getRpcSubscriptionsChannelWithJSONSerialization } from './rpc-subscriptions-json';
import { getRpcSubscriptionsChannelWithBigIntJSONSerialization } from './rpc-subscriptions-json-bigint';

export type DefaultRpcSubscriptionsChannelConfig<TClusterUrl extends ClusterUrl> = Readonly<{
    /**
     * The number of milliseconds to wait since the last message sent or received over the channel
     * before sending a ping message to keep the channel open.
     */
    intervalMs?: number;
    /**
     * The number of subscribers that may share a channel before a new channel must be created.
     *
     * It is important that you set this to the maximum number of subscriptions that your RPC
     * provider recommends making over a single connection; the default is set deliberately low, so
     * as to comply with the restrictive limits of the public mainnet RPC node.
     *
     * @defaultValue 100
     */
    maxSubscriptionsPerChannel?: number;
    /** The number of channels to create before reusing a channel for a new subscription. */
    minChannels?: number;
    /**
     * The number of bytes of data to admit into the
     * [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) buffer before
     * buffering data on the client.
     */
    sendBufferHighWatermark?: number;
    /** The URL of the web socket server. Must use the `ws` or `wss` protocols. */
    url: TClusterUrl;
}>;

/**
 * Similar to {@link createDefaultRpcSubscriptionsChannelCreator} with some Solana-specific
 * defaults.
 *
 * For instance, it safely handles `BigInt` values in JSON messages since Solana RPC servers accept
 * and return integers larger than [`Number.MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER).
 */
export function createDefaultSolanaRpcSubscriptionsChannelCreator<TClusterUrl extends ClusterUrl>(
    config: DefaultRpcSubscriptionsChannelConfig<TClusterUrl>,
): RpcSubscriptionsChannelCreatorFromClusterUrl<TClusterUrl, unknown, unknown> {
    return createDefaultRpcSubscriptionsChannelCreatorImpl({
        ...config,
        jsonSerializer: getRpcSubscriptionsChannelWithBigIntJSONSerialization,
    });
}

/**
 * Creates a function that returns new subscription channels when called.
 */
export function createDefaultRpcSubscriptionsChannelCreator<TClusterUrl extends ClusterUrl>(
    config: DefaultRpcSubscriptionsChannelConfig<TClusterUrl>,
): RpcSubscriptionsChannelCreatorFromClusterUrl<TClusterUrl, unknown, unknown> {
    return createDefaultRpcSubscriptionsChannelCreatorImpl({
        ...config,
        jsonSerializer: getRpcSubscriptionsChannelWithJSONSerialization,
    });
}

function createDefaultRpcSubscriptionsChannelCreatorImpl<TClusterUrl extends ClusterUrl>(
    config: DefaultRpcSubscriptionsChannelConfig<TClusterUrl> & {
        jsonSerializer: (channel: RpcSubscriptionsChannel<string, string>) => RpcSubscriptionsChannel<unknown, unknown>;
    },
): RpcSubscriptionsChannelCreatorFromClusterUrl<TClusterUrl, unknown, unknown> {
    if (/^wss?:/i.test(config.url) === false) {
        const protocolMatch = config.url.match(/^([^:]+):/);
        throw new DOMException(
            protocolMatch
                ? "Failed to construct 'WebSocket': The URL's scheme must be either 'ws' or " +
                  `'wss'. '${protocolMatch[1]}:' is not allowed.`
                : `Failed to construct 'WebSocket': The URL '${config.url}' is invalid.`,
        );
    }
    const { intervalMs, ...rest } = config;
    const createDefaultRpcSubscriptionsChannel = (({ abortSignal }) => {
        return createWebSocketChannel({
            ...rest,
            sendBufferHighWatermark:
                config.sendBufferHighWatermark ??
                // Let 128KB of data into the WebSocket buffer before buffering it in the app.
                131_072,
            signal: abortSignal,
        })
            .then(config.jsonSerializer)
            .then(channel =>
                getRpcSubscriptionsChannelWithAutoping({
                    abortSignal,
                    channel,
                    intervalMs: intervalMs ?? 5_000,
                }),
            );
    }) as RpcSubscriptionsChannelCreatorFromClusterUrl<TClusterUrl, unknown, unknown>;
    return getChannelPoolingChannelCreator(createDefaultRpcSubscriptionsChannel, {
        maxSubscriptionsPerChannel:
            config.maxSubscriptionsPerChannel ??
            /**
             * A note about this default. The idea here is that, because some RPC providers impose
             * an upper limit on the number of subscriptions you can make per channel, we must
             * choose a number low enough to avoid hitting that limit. Without knowing what provider
             * a given person is using, or what their limit is, we have to choose the lowest of all
             * known limits. As of this writing (October 2024) that is the public mainnet RPC node
             * (api.mainnet-beta.solana.com) at 100 subscriptions.
             */
            100,
        minChannels: config.minChannels ?? 1,
    });
}
