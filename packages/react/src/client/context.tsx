import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import type { Dispatch, ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';

import type { ClientAction } from './reducer';
import { clientReducer, createInitialClientState } from './reducer';
import type { ClientLogger, ClientState, SolanaClientConfig, SolanaClientRuntime } from './types';

type SolanaActionsContextValue = {
    dispatch: Dispatch<ClientAction>;
    getState: () => ClientState;
    logger: ClientLogger;
    runtime: SolanaClientRuntime;
};

type SolanaContextValue = SolanaActionsContextValue & {
    state: ClientState;
};

const SolanaStateContext = createContext<ClientState | null>(null);
const SolanaActionsContext = createContext<SolanaActionsContextValue | null>(null);

type ProviderProps = Readonly<{
    children: ReactNode;
    config: SolanaClientConfig;
}>;

const fallbackLogger: ClientLogger = ({ data, level, message }) => {
    const log = level === 'debug' ? console.debug : level === 'error' ? console.error : level === 'info' ? console.info : console.warn;
    if (data && Object.keys(data).length > 0) {
        log(`[solana-react] ${message}`, data);
    } else {
        log(`[solana-react] ${message}`);
    }
};

/**
 * Provide Solana client state, runtime utilities, and wallet helpers to a subtree of React components.
 *
 * @param props - Component properties.
 * @param props.children - React nodes that should receive access to the Solana context.
 * @param props.config - Solana client configuration, including RPC endpoints and optional logger.
 * @returns A React element that wires the Solana context around its children.
 */
export function SolanaProvider({ children, config }: ProviderProps): ReactElement {
    const logger = config.logger ?? fallbackLogger;
    const initialState = createInitialClientState({
        commitment: config.commitment ?? 'confirmed',
        endpoint: config.endpoint,
        websocketEndpoint: config.websocketEndpoint,
    });

    const [state, dispatch] = useReducer(clientReducer, initialState);

    const runtimeRef = useRef<SolanaClientRuntime>({
        rpc: createSolanaRpc(config.endpoint),
        rpcSubscriptions: createSolanaRpcSubscriptions(config.websocketEndpoint ?? config.endpoint),
    });

    const stateRef = useRef(state);
    stateRef.current = state;

    const getState = useCallback(() => stateRef.current, []);

    const actionsValue = useMemo<SolanaActionsContextValue>(
        () => ({
            dispatch,
            getState,
            logger,
            runtime: runtimeRef.current,
        }),
        [dispatch, getState, logger],
    );

    return (
        <SolanaActionsContext.Provider value={actionsValue}>
            <SolanaStateContext.Provider value={state}>{children}</SolanaStateContext.Provider>
        </SolanaActionsContext.Provider>
    );
}

/**
 * Access the Solana client context created by {@link SolanaProvider}.
 *
 * @returns The context value containing state, runtime helpers, and dispatcher references.
 * @throws When invoked outside of a provider boundary.
 */
export function useSolanaContext(): SolanaContextValue {
    const actions = useSolanaActions();
    const state = useSolanaState();
    return useMemo(
        () => ({
            ...actions,
            state,
        }),
        [actions, state],
    );
}

/**
 * Access only the Solana client state.
 *
 * @returns The latest client state snapshot exposed by the provider.
 * @throws When invoked outside of a provider boundary.
 */
export function useSolanaState(): ClientState {
    const state = useContext(SolanaStateContext);
    if (!state) {
        throw new Error('useSolanaState must be used within a SolanaProvider.');
    }
    return state;
}

/**
 * Access the Solana client actions and runtime utilities.
 *
 * @returns Runtime helpers including dispatch, logger, and RPC interfaces.
 * @throws When invoked outside of a provider boundary.
 */
export function useSolanaActions(): SolanaActionsContextValue {
    const actions = useContext(SolanaActionsContext);
    if (!actions) {
        throw new Error('useSolanaActions must be used within a SolanaProvider.');
    }
    return actions;
}
