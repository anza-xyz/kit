import React from 'react';
import { act, create } from 'react-test-renderer';

import {
    SolanaProvider,
    useSolanaActions,
    useSolanaContext,
    useSolanaState,
} from '../client/context';
import { renderHook } from '../test-renderer';

jest.mock('@solana/kit', () => ({
    createSolanaRpc: jest.fn(() => ({ rpc: true })),
    createSolanaRpcSubscriptions: jest.fn(() => ({ rpcSubscriptions: true })),
}));

const { createSolanaRpc, createSolanaRpcSubscriptions } = jest.requireMock('@solana/kit');
(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe('Solana context', () => {
    beforeEach(() => {
        jest.mocked(createSolanaRpc).mockReturnValue({ rpc: true });
        jest.mocked(createSolanaRpcSubscriptions).mockReturnValue({ rpcSubscriptions: true });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('throws when hooks are used outside the provider boundary', () => {
        const stateResult = renderHook(() => useSolanaState()).result;
        expect(stateResult.__type).toBe('error');
        expect(stateResult.current).toEqual(new Error('useSolanaState must be used within a SolanaProvider.'));

        const actionsResult = renderHook(() => useSolanaActions()).result;
        expect(actionsResult.__type).toBe('error');
        expect(actionsResult.current).toEqual(new Error('useSolanaActions must be used within a SolanaProvider.'));
    });

    it('exposes state, actions, and runtime when wrapped in the provider', () => {
        const captured: {
            actions?: ReturnType<typeof useSolanaActions>;
            context?: ReturnType<typeof useSolanaContext>;
            state?: ReturnType<typeof useSolanaState>;
        } = {};
        const config = {
            endpoint: 'https://example.invalid',
        };

        function TestComponent() {
            captured.state = useSolanaState();
            captured.actions = useSolanaActions();
            captured.context = useSolanaContext();
            return null;
        }

        act(() => {
            create(
                <SolanaProvider config={config}>
                    <TestComponent />
                </SolanaProvider>,
            );
        });

        expect(createSolanaRpc).toHaveBeenCalledWith(config.endpoint);
        expect(createSolanaRpcSubscriptions).toHaveBeenCalledWith(config.endpoint);

        expect(captured.state?.wallet.status).toBe('disconnected');
        expect(captured.actions?.dispatch).toEqual(expect.any(Function));
        expect(captured.actions?.logger).toEqual(expect.any(Function));
        expect(captured.actions?.runtime).toEqual({
            rpc: { rpc: true },
            rpcSubscriptions: { rpcSubscriptions: true },
        });
        expect(captured.actions?.getState()).toEqual(captured.state);
        expect(captured.context?.state).toEqual(captured.state);
        expect(captured.context?.runtime).toEqual(captured.actions?.runtime);
    });

    it('passes a websocket override to the subscriptions factory when provided', () => {
        jest.mocked(createSolanaRpc).mockReturnValue({ rpc: true });
        jest.mocked(createSolanaRpcSubscriptions).mockReturnValue({ rpcSubscriptions: true });
        function TestComponent() {
            useSolanaActions();
            return null;
        }
        act(() => {
            create(
                <SolanaProvider
                    config={{
                        endpoint: 'https://main.invalid',
                        websocketEndpoint: 'wss://override.invalid',
                    }}
                >
                    <TestComponent />
                </SolanaProvider>,
            );
        });
        expect(createSolanaRpc).toHaveBeenLastCalledWith('https://main.invalid');
        expect(createSolanaRpcSubscriptions).toHaveBeenLastCalledWith('wss://override.invalid');
    });
});
