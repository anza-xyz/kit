import type { Commitment } from '@solana/rpc-types';

import type { AccountCacheEntry, ClientState, ClusterState, ClusterStatus, WalletStatus } from './types';
import { deepFreeze, now } from './utils';

export type ClientAction =
    | { payload: AccountCacheEntry; type: 'UPDATE_ACCOUNT' }
    | { payload: ClusterState; type: 'SET_CLUSTER' }
    | { payload: ClusterStatus; type: 'SET_CLUSTER_STATUS' }
    | { payload: Partial<ClientState>; type: 'UPDATE_STATE' }
    | { payload: WalletStatus; type: 'SET_WALLET' }
    | { type: 'RESET' };

/**
 * Creates the initial client state used by the reducer.
 *
 * @param config - Initial cluster configuration.
 * @returns Deep-frozen initial client state.
 */
export function createInitialClientState(config: {
    commitment: Commitment;
    endpoint: string;
    websocketEndpoint?: string;
}): ClientState {
    const timestamp = Date.now();
    return deepFreeze({
        accounts: {},
        cluster: {
            commitment: config.commitment,
            endpoint: config.endpoint,
            status: { status: 'idle' },
            websocketEndpoint: config.websocketEndpoint,
        },
        lastUpdatedAt: timestamp,
        subscriptions: {
            account: {},
            signature: {},
        },
        transactions: {},
        wallet: { status: 'disconnected' },
    });
}

/**
 * Reducer function that handles all client state updates.
 *
 * @param state - Current client state.
 * @param action - Action to apply to the state.
 * @returns New client state after applying the action.
 */
export function clientReducer(state: ClientState, action: ClientAction): ClientState {
    switch (action.type) {
        case 'SET_CLUSTER':
            return {
                ...state,
                cluster: action.payload,
                lastUpdatedAt: now(),
            };

        case 'SET_CLUSTER_STATUS':
            return {
                ...state,
                cluster: {
                    ...state.cluster,
                    status: action.payload,
                },
                lastUpdatedAt: now(),
            };

        case 'SET_WALLET':
            return {
                ...state,
                lastUpdatedAt: now(),
                wallet: action.payload,
            };

        case 'UPDATE_ACCOUNT': {
            const key = action.payload.address.toString();
            return {
                ...state,
                accounts: {
                    ...state.accounts,
                    [key]: action.payload,
                },
                lastUpdatedAt: now(),
            };
        }

        case 'UPDATE_STATE':
            return {
                ...state,
                ...action.payload,
                lastUpdatedAt: now(),
            };

        case 'RESET':
            return createInitialClientState({
                commitment: state.cluster.commitment,
                endpoint: state.cluster.endpoint,
                websocketEndpoint: state.cluster.websocketEndpoint,
            });

        default:
            return state;
    }
}
