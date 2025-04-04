import {
    SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CLOSED_BEFORE_MESSAGE_BUFFERED,
    SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED,
    SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT,
    SolanaError,
} from '@solana/errors';
import { DataPublisher } from '@solana/subscribable';

type RpcSubscriptionsChannelSolanaErrorCode =
    | typeof SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CLOSED_BEFORE_MESSAGE_BUFFERED
    | typeof SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED
    | typeof SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT;

export type RpcSubscriptionChannelEvents<TInboundMessage> = {
    /**
     * Fires when the channel closes unexpectedly.
     * @eventProperty
     */
    error: SolanaError<RpcSubscriptionsChannelSolanaErrorCode>;
    /**
     * Fires on every message received from the remote end.
     * @eventProperty
     */
    message: TInboundMessage;
};

/**
 * A {@link DataPublisher} on which you can subscribe to events of type
 * {@link RpcSubscriptionChannelEvents | RpcSubscriptionChannelEvents<TInboundMessage>}.
 * Additionally, you can use this object to send messages of type `TOutboundMessage` back to the
 * remote end by calling its {@link RpcSubscriptionsChannel.send | `send(message)`} method.
 */
export interface RpcSubscriptionsChannel<TOutboundMessage, TInboundMessage>
    extends DataPublisher<RpcSubscriptionChannelEvents<TInboundMessage>> {
    send(message: TOutboundMessage): Promise<void>;
}

/**
 * A channel creator is a function that accepts an `AbortSignal`, returns a new
 * {@link RpcSubscriptionsChannel}, and tears down the channel when the abort signal fires.
 */
export type RpcSubscriptionsChannelCreator<TOutboundMessage, TInboundMessage> = (
    config: Readonly<{
        abortSignal: AbortSignal;
    }>,
) => Promise<RpcSubscriptionsChannel<TOutboundMessage, TInboundMessage>>;

/**
 * Given a channel with inbound messages of type `T` and a function of type `T => U`, returns a new
 * channel with inbound messages of type `U`.
 *
 * Note that this only affects messages of type `"message"` and thus, does not affect incoming error
 * messages.
 *
 * @example Parsing incoming JSON messages
 * ```ts
 * const transformedChannel = transformChannelInboundMessages(channel, JSON.parse);
 * ```
 */
export function transformChannelInboundMessages<TOutboundMessage, TNewInboundMessage, TInboundMessage>(
    channel: RpcSubscriptionsChannel<TOutboundMessage, TInboundMessage>,
    transform: (message: TInboundMessage) => TNewInboundMessage,
): RpcSubscriptionsChannel<TOutboundMessage, TNewInboundMessage> {
    return Object.freeze<RpcSubscriptionsChannel<TOutboundMessage, TNewInboundMessage>>({
        ...channel,
        on(type, subscriber, options) {
            if (type !== 'message') {
                return channel.on(
                    type,
                    subscriber as (data: RpcSubscriptionChannelEvents<TInboundMessage>[typeof type]) => void,
                    options,
                );
            }
            return channel.on(
                'message',
                message => (subscriber as (data: TNewInboundMessage) => void)(transform(message)),
                options,
            );
        },
    });
}

/**
 * Given a channel with outbound messages of type `T` and a function of type `U => T`, returns a new
 * channel with outbound messages of type `U`.
 *
 * @example Stringifying JSON messages before sending them over the wire
 * ```ts
 * const transformedChannel = transformChannelOutboundMessages(channel, JSON.stringify);
 * ```
 */
export function transformChannelOutboundMessages<TNewOutboundMessage, TOutboundMessage, TInboundMessage>(
    channel: RpcSubscriptionsChannel<TOutboundMessage, TInboundMessage>,
    transform: (message: TNewOutboundMessage) => TOutboundMessage,
): RpcSubscriptionsChannel<TNewOutboundMessage, TInboundMessage> {
    return Object.freeze<RpcSubscriptionsChannel<TNewOutboundMessage, TInboundMessage>>({
        ...channel,
        send: message => channel.send(transform(message)),
    });
}
