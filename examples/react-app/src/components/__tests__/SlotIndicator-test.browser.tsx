import type { Rpc, RpcSubscriptions, SolanaRpcApiMainnet, SolanaRpcSubscriptionsApi } from '@solana/kit';
import { act, waitFor } from '@testing-library/react';
import React from 'react';

import { render } from '../../__test-utils__/render';
import { ChainContext, DEFAULT_CHAIN_CONFIG } from '../../context/ChainContext';
import { RpcContext } from '../../context/RpcContext';
import { SlotIndicator } from '../SlotIndicator';

type SlotNotification = Readonly<{ parent: bigint; root: bigint; slot: bigint }>;
type Snapshot =
    { data: SlotNotification | undefined; error: undefined; status: 'loading' } | { data: SlotNotification | undefined; error: unknown; status: 'error' } | { data: SlotNotification; error: undefined; status: 'loaded' } | { data: undefined; error: undefined; status: 'idle' };

function makeReactiveStreamStore() {
    const subscribers = new Set<() => void>();
    let snapshot: Snapshot = { data: undefined, error: undefined, status: 'idle' };
    const setSnapshot = (next: Snapshot) => {
        snapshot = next;
        subscribers.forEach(cb => cb());
    };
    const connect = jest.fn(() => {
        setSnapshot({ data: snapshot.data, error: undefined, status: 'loading' });
    });
    const reset = jest.fn(() => {
        snapshot = { data: undefined, error: undefined, status: 'idle' };
        subscribers.forEach(cb => cb());
    });
    return {
        connectCalls: () => connect.mock.calls.length,
        publish(notification: SlotNotification) {
            setSnapshot({ data: notification, error: undefined, status: 'loaded' });
        },
        publishError(error: unknown) {
            setSnapshot({ data: snapshot.data, error, status: 'error' });
        },
        resetCalls: () => reset.mock.calls.length,
        store: {
            connect,
            getError: () => snapshot.error,
            getState: () => snapshot.data,
            getUnifiedState: () => snapshot,
            reset,
            retry: jest.fn(),
            subscribe: (cb: () => void) => {
                subscribers.add(cb);
                return () => {
                    subscribers.delete(cb);
                };
            },
            withSignal: () => ({ connect }),
        },
    };
}

function makeMockRpcSubscriptions(reactiveStore: jest.Mock) {
    const slotNotifications = jest.fn().mockReturnValue({ reactiveStore });
    return { slotNotifications } as unknown as RpcSubscriptions<SolanaRpcSubscriptionsApi>;
}

function makeWrapper(rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>) {
    const rpc = {} as Rpc<SolanaRpcApiMainnet>;
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <ChainContext.Provider value={DEFAULT_CHAIN_CONFIG}>
                <RpcContext.Provider value={{ rpc, rpcSubscriptions }}>{children}</RpcContext.Provider>
            </ChainContext.Provider>
        );
    };
}

describe('SlotIndicator', () => {
    it('renders an em-dash while the stream is still loading', () => {
        const harness = makeReactiveStreamStore();
        const rpcSubscriptions = makeMockRpcSubscriptions(jest.fn().mockReturnValue(harness.store));
        const { container } = render(<SlotIndicator />, { wrapper: makeWrapper(rpcSubscriptions) });
        expect(container.textContent).toBe('\u2013');
    });

    it('calls `connect()` on mount and `reset()` on unmount', () => {
        const harness = makeReactiveStreamStore();
        const rpcSubscriptions = makeMockRpcSubscriptions(jest.fn().mockReturnValue(harness.store));
        const { unmount } = render(<SlotIndicator />, { wrapper: makeWrapper(rpcSubscriptions) });
        // StrictMode invokes effects twice in dev, so check ≥1 rather than exact equality.
        expect(harness.connectCalls()).toBeGreaterThan(0);
        const resetsBeforeUnmount = harness.resetCalls();
        unmount();
        expect(harness.resetCalls()).toBeGreaterThan(resetsBeforeUnmount);
    });

    it('renders the formatted slot number once a notification is loaded', async () => {
        const harness = makeReactiveStreamStore();
        const rpcSubscriptions = makeMockRpcSubscriptions(jest.fn().mockReturnValue(harness.store));
        const { container } = render(<SlotIndicator />, { wrapper: makeWrapper(rpcSubscriptions) });

        act(() => {
            harness.publish({ parent: 122n, root: 100n, slot: 123n });
        });
        await waitFor(() => expect(container.textContent).toContain('123'));

        const link = container.querySelector('a');
        expect(link).not.toBeNull();
        expect(link?.getAttribute('href')).toContain('/block/123');
        expect(link?.getAttribute('href')).toContain('cluster=devnet');
    });
});
