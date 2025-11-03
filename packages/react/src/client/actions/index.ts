import { type AccountActions, useAccountActions } from './accounts';
import { type ClusterActions, useClusterActions } from './cluster';
import type { WalletActions } from './wallet';
import { useWalletActions } from './wallet';

export type { AccountActions, ClusterActions, WalletActions };

export type ClientActions = AccountActions & ClusterActions & WalletActions;

type UseActionsConfig = Parameters<typeof useWalletActions>[0];

/**
 * Aggregate account, cluster, and wallet helpers into a single convenience hook.
 *
 * @param config - Solana client configuration provided to the surrounding provider.
 * @returns Combined helpers spanning wallet, cluster, and account operations.
 */

export function useActions(config: UseActionsConfig): ClientActions {
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
