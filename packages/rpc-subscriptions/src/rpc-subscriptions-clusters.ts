import type {
    RpcSubscriptions,
    RpcSubscriptionsChannel,
    RpcSubscriptionsChannelCreator,
    RpcSubscriptionsTransport,
} from '@solana/rpc-subscriptions-spec';
import type { ClusterUrl, DevnetUrl, MainnetUrl, TestnetUrl } from '@solana/rpc-types';

export type RpcSubscriptionsChannelCreatorDevnet<TOutboundMessage, TInboundMessage> = RpcSubscriptionsChannelCreator<
    TOutboundMessage,
    TInboundMessage
> & {
    '~cluster': 'devnet';
};
export type RpcSubscriptionsChannelCreatorTestnet<TOutboundMessage, TInboundMessage> = RpcSubscriptionsChannelCreator<
    TOutboundMessage,
    TInboundMessage
> & {
    '~cluster': 'testnet';
};
export type RpcSubscriptionsChannelCreatorMainnet<TOutboundMessage, TInboundMessage> = RpcSubscriptionsChannelCreator<
    TOutboundMessage,
    TInboundMessage
> & {
    '~cluster': 'mainnet';
};
export type RpcSubscriptionsChannelCreatorWithCluster<TOutboundMessage, TInboundMessage> =
    | RpcSubscriptionsChannelCreatorDevnet<TOutboundMessage, TInboundMessage>
    | RpcSubscriptionsChannelCreatorMainnet<TOutboundMessage, TInboundMessage>
    | RpcSubscriptionsChannelCreatorTestnet<TOutboundMessage, TInboundMessage>;
export type RpcSubscriptionsChannelCreatorFromClusterUrl<
    TClusterUrl extends ClusterUrl,
    TOutboundMessage,
    TInboundMessage,
> = TClusterUrl extends DevnetUrl
    ? RpcSubscriptionsChannelCreatorDevnet<TOutboundMessage, TInboundMessage>
    : TClusterUrl extends TestnetUrl
      ? RpcSubscriptionsChannelCreatorTestnet<TOutboundMessage, TInboundMessage>
      : TClusterUrl extends MainnetUrl
        ? RpcSubscriptionsChannelCreatorMainnet<TOutboundMessage, TInboundMessage>
        : RpcSubscriptionsChannelCreator<TOutboundMessage, TInboundMessage>;

/**
 * A {@link RpcSubscriptionsChannel} that communicates with the devnet cluster.
 *
 * Such channels are understood to communicate with a RPC server that services devnet, and as such
 * might only be accepted for use as the channel of a {@link RpcSubscriptionsTransportDevnet}.
 *
 * This is useful in cases where you need to make assertions about what capabilities a RPC offers.
 * You can use the ability to assert on the type of RPC channel at compile time to prevent calling
 * unimplemented methods or presuming the existence of unavailable programs or data.
 */
export type RpcSubscriptionsChannelDevnet<TOutboundMessage, TInboundMessage> = RpcSubscriptionsChannel<
    TOutboundMessage,
    TInboundMessage
> & { '~cluster': 'devnet' };
/**
 * A {@link RpcSubscriptionsChannel} that communicates with the testnet cluster.
 *
 * Such channels are understood to communicate with a RPC server that services testnet, and as such
 * might only be accepted for use as the channel of a {@link RpcSubscriptionsTransportTestnet}.
 *
 * This is useful in cases where you need to make assertions about what capabilities a RPC offers.
 * You can use the ability to assert on the type of RPC channel at compile time to prevent calling
 * unimplemented methods or presuming the existence of unavailable programs or data.
 */
export type RpcSubscriptionsChannelTestnet<TOutboundMessage, TInboundMessage> = RpcSubscriptionsChannel<
    TOutboundMessage,
    TInboundMessage
> & { '~cluster': 'testnet' };
/**
 * A {@link RpcSubscriptionsChannel} that communicates with the mainnet cluster.
 *
 * Such channels are understood to communicate with a RPC server that services mainnet, and as such
 * might only be accepted for use as the channel of a {@link RpcSubscriptionsTransportMainnet}.
 *
 * This is useful in cases where you need to make assertions about what capabilities a RPC offers.
 * You can use the ability to assert on the type of RPC channel at compile time to prevent calling
 * unimplemented methods or presuming the existence of unavailable programs or data.
 */
export type RpcSubscriptionsChannelMainnet<TOutboundMessage, TInboundMessage> = RpcSubscriptionsChannel<
    TOutboundMessage,
    TInboundMessage
> & { '~cluster': 'mainnet' };
export type RpcSubscriptionsChannelWithCluster<TOutboundMessage, TInboundMessage> =
    | RpcSubscriptionsChannelDevnet<TOutboundMessage, TInboundMessage>
    | RpcSubscriptionsChannelMainnet<TOutboundMessage, TInboundMessage>
    | RpcSubscriptionsChannelTestnet<TOutboundMessage, TInboundMessage>;
/**
 * Given a {@link ClusterUrl}, this utility type will resolve to as specific a
 * {@link RpcSubscriptionsChannel} as possible.
 *
 * @example
 * ```ts
 * function createCustomSubscriptionsChannel<TClusterUrl extends ClusterUrl>(
 *     clusterUrl: TClusterUrl,
 * ): RpcSubscriptionsChannelFromClusterUrl<TClusterUrl> {
 *     /* ... *\/
 * }
 *
 * const channel = createCustomSubscriptionsChannel(testnet('ws://api.testnet.solana.com'));
 * channel satisfies RpcSubscriptionsChannelTestnet; // OK
 * ```
 */
export type RpcSubscriptionsChannelFromClusterUrl<
    TClusterUrl extends ClusterUrl,
    TOutboundMessage,
    TInboundMessage,
> = TClusterUrl extends DevnetUrl
    ? RpcSubscriptionsChannelDevnet<TOutboundMessage, TInboundMessage>
    : TClusterUrl extends TestnetUrl
      ? RpcSubscriptionsChannelTestnet<TOutboundMessage, TInboundMessage>
      : TClusterUrl extends MainnetUrl
        ? RpcSubscriptionsChannelMainnet<TOutboundMessage, TInboundMessage>
        : RpcSubscriptionsChannel<TOutboundMessage, TInboundMessage>;

/**
 * A {@link RpcSubscriptionsTransport} that communicates with the devnet cluster.
 *
 * Such transports are understood to communicate with a RPC server that services devnet, and as such
 * might only be accepted for use as the transport of a {@link RpcSubscriptionsDevnet}.
 *
 * This is useful in cases where you need to make assertions about what capabilities a RPC offers.
 * You can use the ability to assert on the type of RPC transport at compile time to prevent calling
 * unimplemented methods or presuming the existence of unavailable programs or data.
 */
export type RpcSubscriptionsTransportDevnet = RpcSubscriptionsTransport & { '~cluster': 'devnet' };
/**
 * A {@link RpcSubscriptionsTransport} that communicates with the testnet cluster.
 *
 * Such transports are understood to communicate with a RPC server that services testnet, and as
 * such might only be accepted for use as the transport of a {@link RpcSubscriptionsTestnet}.
 *
 * This is useful in cases where you need to make assertions about what capabilities a RPC offers.
 * You can use the ability to assert on the type of RPC transport at compile time to prevent calling
 * unimplemented methods or presuming the existence of unavailable programs or data.
 */
export type RpcSubscriptionsTransportTestnet = RpcSubscriptionsTransport & { '~cluster': 'testnet' };
/**
 * A {@link RpcSubscriptionsTransport} that communicates with the mainnet cluster.
 *
 * Such transports are understood to communicate with a RPC server that services mainnet, and as
 * such might only be accepted for use as the transport of a {@link RpcSubscriptionsMainnet}.
 *
 * This is useful in cases where you need to make assertions about what capabilities a RPC offers.
 * You can use the ability to assert on the type of RPC transport at compile time to prevent calling
 * unimplemented methods or presuming the existence of unavailable programs or data.
 */
export type RpcSubscriptionsTransportMainnet = RpcSubscriptionsTransport & { '~cluster': 'mainnet' };
export type RpcSubscriptionsTransportWithCluster =
    | RpcSubscriptionsTransportDevnet
    | RpcSubscriptionsTransportMainnet
    | RpcSubscriptionsTransportTestnet;
/**
 * Given a {@link ClusterUrl}, this utility type will resolve to as specific a
 * {@link RpcSubscriptionsTransport} as possible.
 *
 * @example
 * ```ts
 * function createCustomSubscriptionsTransport<TClusterUrl extends ClusterUrl>(
 *     clusterUrl: TClusterUrl,
 * ): RpcSubscriptionsTransportFromClusterUrl<TClusterUrl> {
 *     /* ... *\/
 * }
 *
 * const transport = createCustomSubscriptionsTransport(testnet('ws://api.testnet.solana.com'));
 * transport satisfies RpcSubscriptionsTransportTestnet; // OK
 * ```
 */
export type RpcSubscriptionsTransportFromClusterUrl<TClusterUrl extends ClusterUrl> = TClusterUrl extends DevnetUrl
    ? RpcSubscriptionsTransportDevnet
    : TClusterUrl extends TestnetUrl
      ? RpcSubscriptionsTransportTestnet
      : TClusterUrl extends MainnetUrl
        ? RpcSubscriptionsTransportMainnet
        : RpcSubscriptionsTransport;
/**
 * A {@link RpcSubscriptions} that supports the RPC Subscriptions methods available on the devnet
 * cluster.
 *
 * This is useful in cases where you need to make assertions about the suitability of a RPC for a
 * given purpose. For example, you might like to make it a type error to combine certain types with
 * RPCs belonging to certain clusters, at compile time.
 *
 * @example
 * ```ts
 * async function subscribeToSpecialAccountNotifications(
 *     address: Address<'ReAL1111111111111111111111111111'>,
 *     rpcSubscriptions: RpcSubscriptionsMainnet<unknown>,
 *     abortSignal: AbortSignal,
 * ): Promise<AsyncIterable<SpecialAccountInfo>>;
 * async function subscribeToSpecialAccountNotifications(
 *     address: Address<'TeST1111111111111111111111111111'>,
 *     rpcSubscriptions: RpcSubscriptionsDevnet<unknown> | RpcTestnet<unknown>,
 *     abortSignal: AbortSignal,
 * ): Promise<AsyncIterable<SpecialAccountInfo>>;
 * async function subscribeToSpecialAccountNotifications(
 *     address: Address,
 *     rpcSubscriptions: RpcSubscriptions<unknown>,
 *     abortSignal: AbortSignal,
 * ): Promise<AsyncIterable<SpecialAccountInfo>> {
 *     /* ... *\/
 * }
 * const rpcSubscriptions = createSolanaRpcSubscriptions(devnet('https://api.devnet.solana.com'));
 * await subscribeToSpecialAccountNotifications(address('ReAL1111111111111111111111111111'), rpcSubscriptions); // ERROR
 * ```
 */
export type RpcSubscriptionsDevnet<TRpcMethods> = RpcSubscriptions<TRpcMethods> & { '~cluster': 'devnet' };
/**
 * A {@link RpcSubscriptions} that supports the RPC Subscriptions methods available on the testnet
 * cluster.
 *
 * This is useful in cases where you need to make assertions about the suitability of a RPC for a
 * given purpose. For example, you might like to make it a type error to combine certain types with
 * RPCs belonging to certain clusters, at compile time.
 *
 * @example
 * ```ts
 * async function subscribeToSpecialAccountNotifications(
 *     address: Address<'ReAL1111111111111111111111111111'>,
 *     rpcSubscriptions: RpcSubscriptionsMainnet<unknown>,
 *     abortSignal: AbortSignal,
 * ): Promise<AsyncIterable<SpecialAccountInfo>>;
 * async function subscribeToSpecialAccountNotifications(
 *     address: Address<'TeST1111111111111111111111111111'>,
 *     rpcSubscriptions: RpcSubscriptionsDevnet<unknown> | RpcTestnet<unknown>,
 *     abortSignal: AbortSignal,
 * ): Promise<AsyncIterable<SpecialAccountInfo>>;
 * async function subscribeToSpecialAccountNotifications(
 *     address: Address,
 *     rpcSubscriptions: RpcSubscriptions<unknown>,
 *     abortSignal: AbortSignal,
 * ): Promise<AsyncIterable<SpecialAccountInfo>> {
 *     /* ... *\/
 * }
 * const rpcSubscriptions = createSolanaRpcSubscriptions(devnet('https://api.devnet.solana.com'));
 * await subscribeToSpecialAccountNotifications(address('ReAL1111111111111111111111111111'), rpcSubscriptions); // ERROR
 * ```
 */

export type RpcSubscriptionsTestnet<TRpcMethods> = RpcSubscriptions<TRpcMethods> & { '~cluster': 'testnet' };
/**
 * A {@link RpcSubscriptions} that supports the RPC Subscriptions methods available on the mainnet
 * cluster.
 *
 * This is useful in cases where you need to make assertions about the suitability of a RPC for a
 * given purpose. For example, you might like to make it a type error to combine certain types with
 * RPCs belonging to certain clusters, at compile time.
 *
 * @example
 * ```ts
 * async function subscribeToSpecialAccountNotifications(
 *     address: Address<'ReAL1111111111111111111111111111'>,
 *     rpcSubscriptions: RpcSubscriptionsMainnet<unknown>,
 *     abortSignal: AbortSignal,
 * ): Promise<AsyncIterable<SpecialAccountInfo>>;
 * async function subscribeToSpecialAccountNotifications(
 *     address: Address<'TeST1111111111111111111111111111'>,
 *     rpcSubscriptions: RpcSubscriptionsDevnet<unknown> | RpcTestnet<unknown>,
 *     abortSignal: AbortSignal,
 * ): Promise<AsyncIterable<SpecialAccountInfo>>;
 * async function subscribeToSpecialAccountNotifications(
 *     address: Address,
 *     rpcSubscriptions: RpcSubscriptions<unknown>,
 *     abortSignal: AbortSignal,
 * ): Promise<AsyncIterable<SpecialAccountInfo>> {
 *     /* ... *\/
 * }
 * const rpcSubscriptions = createSolanaRpcSubscriptions(devnet('https://api.devnet.solana.com'));
 * await subscribeToSpecialAccountNotifications(address('ReAL1111111111111111111111111111'), rpcSubscriptions); // ERROR
 * ```
 */
export type RpcSubscriptionsMainnet<TRpcMethods> = RpcSubscriptions<TRpcMethods> & { '~cluster': 'mainnet' };
/**
 * Given a {@link RpcSubscriptionsTransport} and a set of RPC methods denoted by `TRpcMethods`, this
 * utility type will resolve to a {@link RpcSubscriptions} that supports those methods on as
 * specific a cluster as possible.
 *
 * @example
 * ```ts
 * function createCustomRpcSubscriptions<TRpcSubscriptionsTransport extends RpcSubscriptionsTransport>(
 *     transport: TRpcSubscriptionsTransport,
 * ): RpcSubscriptionsFromTransport<MyCustomRpcMethods, TRpcSubscriptionsTransport> {
 *     /* ... *\/
 * }
 * const transport = createDefaultRpcSubscriptionsTransport({
 *     createChannel: createDefaultSolanaRpcSubscriptionsChannelCreator({
 *         url: mainnet('ws://rpc.company'),
 *     }),
 * });
 * transport satisfies RpcSubscriptionsTransportMainnet; // OK
 * const rpcSubscriptions = createCustomRpcSubscriptions(transport);
 * rpcSubscriptions satisfies RpcSubscriptionsMainnet<MyCustomRpcMethods>; // OK
 * ```
 */
export type RpcSubscriptionsFromTransport<
    TRpcMethods,
    TRpcSubscriptionsTransport extends RpcSubscriptionsTransport,
> = TRpcSubscriptionsTransport extends RpcSubscriptionsTransportDevnet
    ? RpcSubscriptionsDevnet<TRpcMethods>
    : TRpcSubscriptionsTransport extends RpcSubscriptionsTransportTestnet
      ? RpcSubscriptionsTestnet<TRpcMethods>
      : TRpcSubscriptionsTransport extends RpcSubscriptionsTransportMainnet
        ? RpcSubscriptionsMainnet<TRpcMethods>
        : RpcSubscriptions<TRpcMethods>;
