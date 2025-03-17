import type { SolanaRpcApi, SolanaRpcApiDevnet, SolanaRpcApiMainnet, SolanaRpcApiTestnet } from '@solana/rpc-api';
import type { Rpc, RpcTransport } from '@solana/rpc-spec';
import type { ClusterUrl, DevnetUrl, MainnetUrl, TestnetUrl } from '@solana/rpc-types';

/**
 * A {@link RpcTransport} that communicates with the devnet cluster.
 *
 * Such transports are understood to communicate with a RPC server that services devnet, and as such
 * might only be accepted for use as the transport of a {@link RpcDevnet}.
 *
 * This is useful in cases where you need to make assertions about what capabilities a RPC offers.
 * For example, RPC methods like {@link requestAirdrop} are not available on mainnet. You can use
 * the ability to assert on the type of RPC transport at compile time to prevent calling
 * unimplemented methods or presuming the existence of unavailable capabilities.
 */
export type RpcTransportDevnet = RpcTransport & { '~cluster': 'devnet' };
/**
 * A {@link RpcTransport} that communicates with the testnet cluster.
 *
 * Such transports are understood to communicate with a RPC server that services testnet, and as
 * such  might only be accepted for use as the transport of a {@link RpcTestnet}.
 *
 * This is useful in cases where you need to make assertions about what capabilities a RPC offers.
 * For example, RPC methods like {@link requestAirdrop} are not available on mainnet. You can use
 * the ability to assert on the type of RPC transport at compile time to prevent calling
 * unimplemented methods or presuming the existence of unavailable capabilities.
 */
export type RpcTransportTestnet = RpcTransport & { '~cluster': 'testnet' };
/**
 * A {@link RpcTransport} that communicates with the mainnet cluster.
 *
 * Such transports are understood to communicate with a RPC server that services mainnet, and as
 * such might only be accepted for use as the transport of a {@link RpcMainnet}.
 *
 * This is useful in cases where you need to make assertions about what capabilities a RPC offers.
 * For example, RPC methods like {@link requestAirdrop} are not available on mainnet. You can use
 * the ability to assert on the type of RPC transport at compile time to prevent calling
 * unimplemented methods or presuming the existence of unavailable capabilities.
 */
export type RpcTransportMainnet = RpcTransport & { '~cluster': 'mainnet' };
/**
 * Given a {@link ClusterUrl}, this utility type will resolve to as specific a {@link RpcTransport}
 * as possible.
 *
 * @example
 * ```ts
 * function createCustomTransport<TClusterUrl extends ClusterUrl>(
 *     clusterUrl: TClusterUrl,
 * ): RpcTransportFromClusterUrl<TClusterUrl> {
 *     /* ... *\/
 * }
 *
 * const transport = createCustomTransport(testnet('http://api.testnet.solana.com'));
 * transport satisfies RpcTransportTestnet; // OK
 * ```
 */
export type RpcTransportFromClusterUrl<TClusterUrl extends ClusterUrl> = TClusterUrl extends DevnetUrl
    ? RpcTransportDevnet
    : TClusterUrl extends TestnetUrl
      ? RpcTransportTestnet
      : TClusterUrl extends MainnetUrl
        ? RpcTransportMainnet
        : RpcTransport;
/**
 * A {@link Rpc} that supports the RPC methods available on the devnet cluster.
 *
 * This is useful in cases where you need to make assertions about the suitability of a RPC for a
 * given purpose. For example, you might like to make it a type error to combine certain types with
 * RPCs belonging to certain clusters, at compile time.
 *
 * @example
 * ```ts
 * async function getSpecialAccountInfo(
 *     address: Address<'ReAL1111111111111111111111111111'>,
 *     rpc: RpcMainnet<unknown>,
 * ): Promise<SpecialAccountInfo>;
 * async function getSpecialAccountInfo(
 *     address: Address<'TeST1111111111111111111111111111'>,
 *     rpc: RpcDevnet<unknown> | RpcTestnet<unknown>,
 * ): Promise<SpecialAccountInfo>;
 * async function getSpecialAccountInfo(address: Address, rpc: Rpc<unknown>): Promise<SpecialAccountInfo> {
 *     /* ... *\/
 * }
 * const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));
 * await getSpecialAccountInfo(address('ReAL1111111111111111111111111111'), rpc); // ERROR
 * ```
 */
export type RpcDevnet<TRpcMethods> = Rpc<TRpcMethods> & { '~cluster': 'devnet' };
/**
 * A {@link Rpc} that supports the RPC methods available on the testnet cluster.
 *
 * This is useful in cases where you need to make assertions about the suitability of a RPC for a
 * given purpose. For example, you might like to make it a type error to combine certain types with
 * RPCs belonging to certain clusters, at compile time.
 *
 * @example
 * ```ts
 * async function getSpecialAccountInfo(
 *     address: Address<'ReAL1111111111111111111111111111'>,
 *     rpc: RpcMainnet<unknown>,
 * ): Promise<SpecialAccountInfo>;
 * async function getSpecialAccountInfo(
 *     address: Address<'TeST1111111111111111111111111111'>,
 *     rpc: RpcDevnet<unknown> | RpcTestnet<unknown>,
 * ): Promise<SpecialAccountInfo>;
 * async function getSpecialAccountInfo(address: Address, rpc: Rpc<unknown>): Promise<SpecialAccountInfo> {
 *     /* ... *\/
 * }
 * const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));
 * await getSpecialAccountInfo(address('ReAL1111111111111111111111111111'), rpc); // ERROR
 * ```
 */
export type RpcTestnet<TRpcMethods> = Rpc<TRpcMethods> & { '~cluster': 'testnet' };
/**
 * A {@link Rpc} that supports the RPC methods available on the mainnet cluster.
 *
 * This is useful in cases where you need to make assertions about the suitability of a RPC for a
 * given purpose. For example, you might like to make it a type error to combine certain types with
 * RPCs belonging to certain clusters, at compile time.
 *
 * @example
 * ```ts
 * async function getSpecialAccountInfo(
 *     address: Address<'ReAL1111111111111111111111111111'>,
 *     rpc: RpcMainnet<unknown>,
 * ): Promise<SpecialAccountInfo>;
 * async function getSpecialAccountInfo(
 *     address: Address<'TeST1111111111111111111111111111'>,
 *     rpc: RpcDevnet<unknown> | RpcTestnet<unknown>,
 * ): Promise<SpecialAccountInfo>;
 * async function getSpecialAccountInfo(address: Address, rpc: Rpc<unknown>): Promise<SpecialAccountInfo> {
 *     /* ... *\/
 * }
 * const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));
 * await getSpecialAccountInfo(address('ReAL1111111111111111111111111111'), rpc); // ERROR
 * ```
 */
export type RpcMainnet<TRpcMethods> = Rpc<TRpcMethods> & { '~cluster': 'mainnet' };
/**
 * Given a {@link RpcTransport} and a set of RPC methods denoted by `TRpcMethods`, this utility type
 * will resolve to a {@link Rpc} that supports those methods on as specific a cluster as possible.
 *
 * @example
 * ```ts
 * function createCustomRpc<TRpcTransport extends RpcTransport>(
 *     transport: TRpcTransport,
 * ): RpcFromTransport<MyCustomRpcMethods, TRpcTransport> {
 *     /* ... *\/
 * }
 * const transport = createDefaultRpcTransport({ url: mainnet('http://rpc.company') });
 * transport satisfies RpcTransportMainnet; // OK
 * const rpc = createCustomRpc(transport);
 * rpc satisfies RpcMainnet<MyCustomRpcMethods>; // OK
 * ```
 */
export type RpcFromTransport<TRpcMethods, TRpcTransport extends RpcTransport> = TRpcTransport extends RpcTransportDevnet
    ? RpcDevnet<TRpcMethods>
    : TRpcTransport extends RpcTransportTestnet
      ? RpcTestnet<TRpcMethods>
      : TRpcTransport extends RpcTransportMainnet
        ? RpcMainnet<TRpcMethods>
        : Rpc<TRpcMethods>;
/**
 * Given a {@link RpcTransport} this utility type will resolve to a union of all the methods of the
 * Solana RPC API supported by the transport's cluster.
 *
 * @example
 * ```ts
 * function createSolanaRpcFromTransport<TTransport extends RpcTransport>(
 *     transport: TTransport,
 * ): RpcFromTransport<SolanaRpcApiFromTransport<TTransport>, TTransport> {
 *     /* ... *\/
 * }
 * const transport = createDefaultRpcTransport({ url: mainnet('http://rpc.company') });
 * transport satisfies RpcTransportMainnet; // OK
 * const rpc = createSolanaRpcFromTransport(transport);
 * rpc satisfies RpcMainnet<SolanaRpcApiMainnet>; // OK
 * ```
 */
export type SolanaRpcApiFromTransport<TTransport extends RpcTransport> = TTransport extends RpcTransportDevnet
    ? SolanaRpcApiDevnet
    : TTransport extends RpcTransportTestnet
      ? SolanaRpcApiTestnet
      : TTransport extends RpcTransportMainnet
        ? SolanaRpcApiMainnet
        : SolanaRpcApi;
