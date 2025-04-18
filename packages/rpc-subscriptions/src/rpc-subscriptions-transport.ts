import { pipe } from '@solana/functional';
import { RpcSubscriptionsChannelCreator, RpcSubscriptionsTransport } from '@solana/rpc-subscriptions-spec';
import { ClusterUrl } from '@solana/rpc-types';

import {
    RpcSubscriptionsChannelCreatorDevnet,
    RpcSubscriptionsChannelCreatorFromClusterUrl,
    RpcSubscriptionsChannelCreatorMainnet,
    RpcSubscriptionsChannelCreatorTestnet,
    RpcSubscriptionsTransportDevnet,
    RpcSubscriptionsTransportFromClusterUrl,
    RpcSubscriptionsTransportMainnet,
    RpcSubscriptionsTransportTestnet,
} from './rpc-subscriptions-clusters';
import { getRpcSubscriptionsTransportWithSubscriptionCoalescing } from './rpc-subscriptions-coalescer';

export type DefaultRpcSubscriptionsTransportConfig<TClusterUrl extends ClusterUrl> = Readonly<{
    createChannel: RpcSubscriptionsChannelCreatorFromClusterUrl<TClusterUrl, unknown, unknown>;
}>;

/**
 * Creates a {@link RpcSubscriptionsTransport} with some default behaviours.
 *
 * The default behaviours include:
 * - Logic that coalesces multiple subscriptions for the same notifications with the same arguments
 *   into a single subscription.
 *
 * @param config
 */
export function createDefaultRpcSubscriptionsTransport<TClusterUrl extends ClusterUrl>({
    createChannel,
}: DefaultRpcSubscriptionsTransportConfig<TClusterUrl>) {
    return pipe(
        createRpcSubscriptionsTransportFromChannelCreator(
            createChannel,
        ) as RpcSubscriptionsTransport as RpcSubscriptionsTransportFromClusterUrl<TClusterUrl>,
        transport => getRpcSubscriptionsTransportWithSubscriptionCoalescing(transport),
    );
}

export function createRpcSubscriptionsTransportFromChannelCreator<
    TChannelCreator extends RpcSubscriptionsChannelCreator<TOutboundMessage, TInboundMessage>,
    TInboundMessage,
    TOutboundMessage,
>(createChannel: TChannelCreator) {
    return (async ({ execute, signal }) => {
        const channel = await createChannel({ abortSignal: signal });
        return await execute({ channel, signal });
    }) as TChannelCreator extends RpcSubscriptionsChannelCreatorDevnet<TOutboundMessage, TInboundMessage>
        ? RpcSubscriptionsTransportDevnet
        : TChannelCreator extends RpcSubscriptionsChannelCreatorTestnet<TOutboundMessage, TInboundMessage>
          ? RpcSubscriptionsTransportTestnet
          : TChannelCreator extends RpcSubscriptionsChannelCreatorMainnet<TOutboundMessage, TInboundMessage>
            ? RpcSubscriptionsTransportMainnet
            : RpcSubscriptionsTransport;
}
