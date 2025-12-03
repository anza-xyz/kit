import { SolanaError } from '@solana/errors';
import { DataPublisher } from '@solana/subscribable';

import { RpcSubscriptionsPlan } from './rpc-subscriptions-api';

export type RpcSubscriptionsTransportDataEvents<TNotification> = {
    /**
     * Fires when there is an error with the subscription or the channel.
     * @eventProperty
     */
    error: SolanaError;
    /**
     * Fires on every notification received.
     * @eventProperty
     */
    notification: TNotification;
};

interface RpcSubscriptionsTransportConfig<TNotification> extends RpcSubscriptionsPlan<TNotification> {
    /** An `AbortSignal` to fire when you want to unsubscribe */
    signal: AbortSignal;
}

/**
 * A function that can act as a transport for a {@link RpcSubscriptions}. It need only return a
 * promise for a {@link DataPublisher} given the supplied config.
 */
export interface RpcSubscriptionsTransport {
    <TNotification>(
        config: RpcSubscriptionsTransportConfig<TNotification>,
    ): Promise<DataPublisher<RpcSubscriptionsTransportDataEvents<TNotification>>>;
}
