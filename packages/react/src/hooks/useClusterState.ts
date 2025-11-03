import { useSolanaState } from '../client/context';
import type { ClusterState } from '../client/types';

/**
 * Read the full cluster state managed by the Solana client.
 *
 * @returns The latest cluster metadata including endpoint, commitment, and status.
 */
export function useClusterState(): ClusterState {
    const state = useSolanaState();
    return state.cluster;
}
