import type { SolanaClientConfig } from '../types';
import { type AccountActions, useAccountActions } from './accounts';
import { type ClusterActions, useClusterActions } from './cluster';
import type { WalletActions } from './wallet';
import { useWalletActions } from './wallet';

export type { AccountActions, ClusterActions, WalletActions };

export type ClientActions = AccountActions & ClusterActions & WalletActions;

/**
 * Aggregate account, cluster, and wallet helpers into a single convenience hook.
 *
 * @param config - Solana client configuration provided to the surrounding provider.
 * @returns Combined helpers spanning wallet, cluster, and account operations.
 */

export function useActions(config?: SolanaClientConfig): ClientActions {
    const wallet = useWalletActions(config);
    const cluster = useClusterActions(config);
    const accounts = useAccountActions(config);
    return {
        ...wallet,
        ...cluster,
        ...accounts,
    };
}

export { useAccountActions, useClusterActions, useWalletActions };
