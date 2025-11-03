/**
 * This package contains React hooks for building Solana apps.
 *
 * @packageDocumentation
 */

// Signing hooks
export * from './useSignAndSendTransaction';
export * from './useSignIn';
export * from './useSignMessage';
export * from './useSignTransaction';
export * from './useWalletAccountMessageSigner';
export * from './useWalletAccountTransactionSigner';
export * from './useWalletAccountTransactionSendingSigner';

// Client context and provider
export { SolanaProvider, useSolanaActions, useSolanaContext, useSolanaState } from './client/context';

// Client types
export type {
    AccountCache,
    AccountCacheEntry,
    AccountWatcherConfig,
    BalanceWatcherConfig,
    ClientLogger,
    ClientState,
    ClusterState,
    ClusterStatus,
    LogLevel,
    SolanaClientConfig,
    SolanaClientRuntime,
    SolanaRpcInstance,
    SolanaSubscriptionsInstance,
    WalletAccount,
    WalletConnector,
    WalletConnectorMetadata,
    WalletRegistry,
    WalletSession,
    WalletStatus,
    WatchSubscription,
} from './client/types';

// Wallet hooks
export { useWallet } from './hooks/useWallet';
export { useWalletSession } from './hooks/useWalletSession';
export { useConnectWallet } from './hooks/useConnectWallet';
export { useDisconnectWallet } from './hooks/useDisconnectWallet';
export { useWalletStandardConnectors } from './hooks/useWalletStandardConnectors';

// Cluster hooks
export { useClusterState } from './hooks/useClusterState';
export { useClusterStatus } from './hooks/useClusterStatus';

// Account and balance hooks
export { useAccount } from './hooks/useAccount';
export { useBalance } from './hooks/useBalance';

// Wallet Standard utilities
export {
    createWalletStandardConnector,
    getWalletStandardConnectors,
    watchWalletStandardConnectors,
} from './wallet/standard';
export type { WalletStandardConnectorMetadata, WalletStandardDiscoveryOptions } from './wallet/standard';

// Wallet registry
export { createWalletRegistry } from './wallet/registry';
