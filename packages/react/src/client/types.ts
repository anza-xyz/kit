import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import type { Commitment, Lamports } from '@solana/rpc-types';
import type { SendableTransaction, Transaction } from '@solana/transactions';

export type SolanaRpcInstance = ReturnType<typeof createSolanaRpc>;
export type SolanaSubscriptionsInstance = ReturnType<typeof createSolanaRpcSubscriptions>;

export type LogLevel = 'debug' | 'error' | 'info' | 'warn';

export type ClientLogger = (event: { data?: Record<string, unknown>; level: LogLevel; message: string }) => void;

export type WalletConnectorMetadata = Readonly<{
    canAutoConnect?: boolean;
    icon?: string;
    id: string;
    name: string;
}>;

export type WalletAccount = Readonly<{
    address: Address;
    label?: string;
    publicKey: Uint8Array;
}>;

export type WalletSession = Readonly<{
    account: WalletAccount;
    connector: WalletConnectorMetadata;
    disconnect(): Promise<void>;
    sendTransaction?(transaction: SendableTransaction & Transaction, config?: Readonly<{ commitment?: Commitment }>): Promise<Signature>;
    signMessage?(message: Uint8Array): Promise<Uint8Array>;
    signTransaction?(transaction: SendableTransaction & Transaction): Promise<SendableTransaction & Transaction>;
}>;

export type WalletConnector = WalletConnectorMetadata & {
    connect(opts?: Readonly<{ autoConnect?: boolean }>): Promise<WalletSession>;
    disconnect(): Promise<void>;
    isSupported(): boolean;
};

type WalletStatusConnected = Readonly<{
    connectorId: string;
    session: WalletSession;
    status: 'connected';
}>;

type WalletStatusConnecting = Readonly<{
    connectorId: string;
    status: 'connecting';
}>;

type WalletStatusDisconnected = Readonly<{
    status: 'disconnected';
}>;

type WalletStatusError = Readonly<{
    connectorId?: string;
    error: unknown;
    status: 'error';
}>;

export type WalletStatus = WalletStatusConnected | WalletStatusConnecting | WalletStatusDisconnected | WalletStatusError;

type ClusterStatusConnecting = Readonly<{ status: 'connecting' }>;

type ClusterStatusError = Readonly<{
    error: unknown;
    status: 'error';
}>;

type ClusterStatusIdle = Readonly<{ status: 'idle' }>;

type ClusterStatusReady = Readonly<{
    latencyMs?: number;
    status: 'ready';
}>;

export type ClusterStatus = ClusterStatusConnecting | ClusterStatusError | ClusterStatusIdle | ClusterStatusReady;

export type ClusterState = Readonly<{
    commitment: Commitment;
    endpoint: string;
    status: ClusterStatus;
    websocketEndpoint?: string;
}>;

export type AccountCacheEntry = Readonly<{
    address: Address;
    data?: unknown;
    error?: unknown;
    fetching: boolean;
    lamports: Lamports | null;
    lastFetchedAt?: number;
    slot: bigint | null;
}>;

export type AccountCache = Record<string, AccountCacheEntry>;

export type TransactionRecord = Readonly<{
    error?: unknown;
    lastUpdatedAt: number;
    signature?: Signature;
    status: 'confirmed' | 'failed' | 'idle' | 'sending' | 'waiting';
}>;

export type TransactionState = Record<string, TransactionRecord>;

type SubscriptionStatusActivating = Readonly<{ status: 'activating' }>;

type SubscriptionStatusActive = Readonly<{ status: 'active' }>;

type SubscriptionStatusError = Readonly<{ error: unknown; status: 'error' }>;

type SubscriptionStatusInactive = Readonly<{ status: 'inactive' }>;

export type SubscriptionStatus =
    | SubscriptionStatusActivating
    | SubscriptionStatusActive
    | SubscriptionStatusError
    | SubscriptionStatusInactive;

export type SubscriptionState = Readonly<{
    account: Record<string, SubscriptionStatus>;
    signature: Record<string, SubscriptionStatus>;
}>;

export type ClientState = Readonly<{
    accounts: AccountCache;
    cluster: ClusterState;
    lastUpdatedAt: number;
    subscriptions: SubscriptionState;
    transactions: TransactionState;
    wallet: WalletStatus;
}>;

export type SolanaClientConfig = Readonly<{
    commitment?: Commitment;
    endpoint: string;
    logger?: ClientLogger;
    walletConnectors?: readonly WalletConnector[];
    websocketEndpoint?: string;
}>;

export type SolanaClientRuntime = {
    rpc: SolanaRpcInstance;
    rpcSubscriptions: SolanaSubscriptionsInstance;
};

export type BalanceWatcherConfig = Readonly<{
    address: Address;
    commitment?: Commitment;
}>;

export type AccountWatcherConfig = Readonly<{
    address: Address;
    commitment?: Commitment;
}>;

export type SignatureWatcherConfig = Readonly<{
    commitment?: Commitment;
    enableReceivedNotification?: boolean;
    signature: Signature;
}>;

export type WatchSubscription = Readonly<{
    abort(): void;
}>;

export type WalletRegistry = Readonly<{
    all: readonly WalletConnector[];
    get(id: string): WalletConnector | undefined;
}>;
