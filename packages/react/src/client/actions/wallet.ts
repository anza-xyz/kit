import { useCallback, useMemo } from 'react';

import { createWalletRegistry } from '../../wallet/registry';
import { useSolanaActions } from '../context';
import type { SolanaClientConfig } from '../types';
import { formatError } from '../utils';

export type WalletActions = {
    connectWallet(connectorId: string): Promise<void>;
    disconnectWallet(): Promise<void>;
};

/**
 * Build wallet management helpers responsible for establishing or tearing down sessions.
 *
 * @param config - Solana client configuration provided to the surrounding provider.
 * @returns Helpers for connecting to and disconnecting from wallets.
 */
export function useWalletActions(config: SolanaClientConfig): WalletActions {
    const { dispatch, getState, logger } = useSolanaActions();
    const connectors = useMemo(() => createWalletRegistry(config.walletConnectors ?? []), [config.walletConnectors]);

    const connectWallet = useCallback(
        async (connectorId: string): Promise<void> => {
            const connector = connectors.get(connectorId);
            if (!connector) {
                throw new Error(`No wallet connector registered for id "${connectorId}".`);
            }
            if (!connector.isSupported()) {
                throw new Error(`Wallet connector "${connectorId}" is not supported in this environment.`);
            }
            dispatch({
                payload: { connectorId, status: 'connecting' },
                type: 'SET_WALLET',
            });
            try {
                const session = await connector.connect();
                dispatch({
                    payload: { connectorId, session, status: 'connected' },
                    type: 'SET_WALLET',
                });
                logger({
                    data: { address: session.account.address.toString(), connectorId },
                    level: 'info',
                    message: 'wallet connected',
                });
            } catch (error) {
                dispatch({
                    payload: { connectorId, error, status: 'error' },
                    type: 'SET_WALLET',
                });
                logger({
                    data: { connectorId, ...formatError(error) },
                    level: 'error',
                    message: 'wallet connection failed',
                });
                throw error;
            }
        },
        [connectors, dispatch, logger],
    );

    const disconnectWallet = useCallback(async (): Promise<void> => {
        const wallet = getState().wallet;
        if (wallet.status === 'disconnected') {
            return;
        }
        try {
            if (wallet.status === 'connected') {
                await wallet.session.disconnect();
                const connector = connectors.get(wallet.connectorId);
                if (connector) {
                    await connector.disconnect();
                }
            } else if (wallet.status === 'connecting') {
                const connector = connectors.get(wallet.connectorId);
                if (connector) {
                    await connector.disconnect();
                }
            }
        } finally {
            dispatch({
                payload: { status: 'disconnected' },
                type: 'SET_WALLET',
            });
            logger({
                data: wallet.status === 'connected' ? { connectorId: wallet.connectorId } : undefined,
                level: 'info',
                message: 'wallet disconnected',
            });
        }
    }, [connectors, dispatch, getState, logger]);

    return { connectWallet, disconnectWallet };
}
