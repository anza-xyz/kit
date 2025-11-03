import { useCallback } from 'react';

import { useWalletActions } from '../client/actions';
import type { SolanaClientConfig } from '../client/types';

/**
 * Create a stable callback that initiates a wallet connection for a given connector identifier.
 *
 * @param config - Solana client configuration provided to the surrounding provider.
 * @returns Function that resolves once the connector finishes attempting to establish a session.
 */
export function useConnectWallet(config?: SolanaClientConfig): (connectorId: string) => Promise<void> {
    const { connectWallet } = useWalletActions(config);
    return useCallback((connectorId: string) => connectWallet(connectorId), [connectWallet]);
}
