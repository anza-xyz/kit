import { useSolanaState } from '../client/context';
import type { ClusterStatus } from '../client/types';

/**
 * Read the current cluster connection status tracked by the Solana client.
 *
 * @returns Status metadata describing readiness, latency, or encountered errors.
 */
export function useClusterStatus(): ClusterStatus {
    const state = useSolanaState();
    return state.cluster.status;
}
