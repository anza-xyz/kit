import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import type { Commitment } from '@solana/rpc-types';
import { useCallback } from 'react';

import { useSolanaActions, useSolanaState } from '../context';
import type { SolanaClientConfig } from '../types';
import { formatError, now } from '../utils';

export type ClusterActions = {
    setCluster(endpoint: string, config?: Readonly<{ commitment?: Commitment; websocketEndpoint?: string }>): Promise<void>;
};

/**
 * Build helpers that manage the active cluster endpoint and runtime clients.
 *
 * @param config - Solana client configuration provided to the surrounding provider.
 * @returns Functions responsible for updating the cluster target and measuring readiness.
 */
export function useClusterActions(_config?: SolanaClientConfig): ClusterActions {
    const state = useSolanaState();
    const { dispatch, logger, runtime } = useSolanaActions();

    const setCluster = useCallback(
        async (
            endpoint: string,
            clusterConfig?: Readonly<{ commitment?: Commitment; websocketEndpoint?: string }>,
        ): Promise<void> => {
            const nextCommitment = clusterConfig?.commitment ?? state.cluster.commitment;
            const websocketEndpoint = clusterConfig?.websocketEndpoint ?? endpoint;
            dispatch({
                payload: {
                    commitment: nextCommitment,
                    endpoint,
                    status: { status: 'connecting' },
                    websocketEndpoint,
                },
                type: 'SET_CLUSTER',
            });
            try {
                runtime.rpc = createSolanaRpc(endpoint);
                runtime.rpcSubscriptions = createSolanaRpcSubscriptions(websocketEndpoint);

                const start = now();
                await runtime.rpc
                    .getLatestBlockhash({ commitment: nextCommitment })
                    .send({ abortSignal: AbortSignal.timeout(10_000) });
                const latencyMs = now() - start;

                dispatch({
                    payload: {
                        commitment: nextCommitment,
                        endpoint,
                        status: { latencyMs, status: 'ready' },
                        websocketEndpoint,
                    },
                    type: 'SET_CLUSTER',
                });
                logger({
                    data: { endpoint, latencyMs, websocketEndpoint },
                    level: 'info',
                    message: 'cluster ready',
                });
            } catch (error) {
                dispatch({
                    payload: {
                        commitment: nextCommitment,
                        endpoint,
                        status: { error, status: 'error' },
                        websocketEndpoint,
                    },
                    type: 'SET_CLUSTER',
                });
                logger({
                    data: { endpoint, ...formatError(error) },
                    level: 'error',
                    message: 'cluster setup failed',
                });
                throw error;
            }
        },
        [dispatch, logger, runtime, state.cluster.commitment],
    );

    return { setCluster };
}
