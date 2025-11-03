import { useSolanaState } from '../client/context';
import type { WalletStatus } from '../client/types';

/**
 * Read the current wallet status from the Solana client context.
 *
 * @returns The latest wallet status, including connector metadata and any active session information.
 */
export function useWallet(): WalletStatus {
    const state = useSolanaState();
    return state.wallet;
}
