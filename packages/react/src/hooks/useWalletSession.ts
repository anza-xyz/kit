import type { WalletSession } from '../client/types';
import { useWallet } from './useWallet';

/**
 * Convenience helper that exposes the active wallet session when the client is connected.
 *
 * @returns The current wallet session or `undefined` when no wallet is connected.
 */
export function useWalletSession(): WalletSession | undefined {
    const wallet = useWallet();
    if (wallet.status === 'connected') {
        return wallet.session;
    }
    return undefined;
}
