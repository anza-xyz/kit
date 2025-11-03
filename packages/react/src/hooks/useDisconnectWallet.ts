import { useCallback } from 'react';

import { useWalletActions } from '../client/actions';
import type { SolanaClientConfig } from '../client/types';

/**
 * Create a stable callback that terminates the active wallet session if one exists.
 *
 * @param config - Solana client configuration provided to the surrounding provider.
 * @returns Function that resolves after the disconnect flow finishes.
 */
export function useDisconnectWallet(config: SolanaClientConfig): () => Promise<void> {
    const { disconnectWallet } = useWalletActions(config);
    return useCallback(() => disconnectWallet(), [disconnectWallet]);
}
