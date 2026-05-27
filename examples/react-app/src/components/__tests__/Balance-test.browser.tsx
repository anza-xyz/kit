import { Theme } from '@radix-ui/themes';
import type {
    AccountNotificationsApi,
    Lamports,
    Rpc,
    RpcSubscriptions,
    SolanaRpcApiMainnet,
    SolanaRpcResponse,
    SolanaRpcSubscriptionsApi,
} from '@solana/kit';
import { createReactiveActionStore, createReactiveStoreFromDataPublisherFactory } from '@solana/kit';
import { act, waitFor } from '@testing-library/react';
import type { UiWalletAccount } from '@wallet-standard/react';
import React from 'react';
import { SWRConfig } from 'swr';

import { render } from '../../__test-utils__/render';
import { ChainContext, DEFAULT_CHAIN_CONFIG } from '../../context/ChainContext';
import { RpcContext } from '../../context/RpcContext';
import { Balance } from '../Balance';

type LamportsResponse = SolanaRpcResponse<Lamports>;
type AccountNotification = SolanaRpcResponse<{ lamports: Lamports }>;

const ACCOUNT_ADDRESS = 'So11111111111111111111111111111111111111112';

function makeAccount(): UiWalletAccount {
    return { address: ACCOUNT_ADDRESS } as UiWalletAccount;
}

function lamportsResponse(slot: number, lamports: bigint): LamportsResponse {
    return { context: { slot: BigInt(slot) }, value: lamports as Lamports };
}

// `Balance` drives `balanceSubscribe`, which consumes the RPC request via its `reactiveStore()`
// method (not `send()`), so the mock backs `getBalance(...)` with a real `ReactiveActionStore`
// wrapping a controllable promise. `resolveGetBalance` / `rejectGetBalance` settle the fetch.
function makeMockRpc() {
    const { promise, resolve, reject } = Promise.withResolvers<LamportsResponse>();
    const execute = jest.fn().mockReturnValue(promise);
    return {
        rejectGetBalance: reject,
        resolveGetBalance: resolve,
        rpc: {
            getBalance: jest.fn().mockReturnValue({
                reactiveStore: () => createReactiveActionStore(execute),
            }),
        } as unknown as Rpc<SolanaRpcApiMainnet>,
    };
}

// The subscription is consumed via its `reactiveStore()` method (not `subscribe()`), so the mock
// backs `accountNotifications(...)` with a real `ReactiveStreamStore` built from a mock
// `DataPublisher` factory. `pushNotification` emits onto the most recent connection through the
// same `'notification'` channel the real RPC uses.
function makeMockSubscriptions() {
    const publishers: { publish(channel: string, payload: unknown): void; signal: AbortSignal | undefined }[] = [];
    const createDataPublisher = jest.fn().mockImplementation((signal?: AbortSignal) => {
        const on = jest.fn().mockReturnValue(function unsubscribe() {});
        publishers.push({
            publish(channel: string, payload: unknown) {
                on.mock.calls
                    .filter(
                        ([actualChannel, , options]: [string, unknown, { signal?: AbortSignal } | undefined]) =>
                            actualChannel === channel && !options?.signal?.aborted,
                    )
                    .forEach(([, listener]) => listener(payload));
            },
            signal,
        });
        return Promise.resolve({ on });
    });
    const rpcSubscriptions = {
        accountNotifications: jest.fn().mockReturnValue({
            reactiveStore: () =>
                createReactiveStoreFromDataPublisherFactory<AccountNotification>({
                    createDataPublisher,
                    dataChannelName: 'notification',
                    errorChannelName: 'error',
                }),
        }),
    } as unknown as RpcSubscriptions<AccountNotificationsApi & SolanaRpcSubscriptionsApi>;
    return {
        pushNotification(notification: AccountNotification) {
            const publisher = publishers[publishers.length - 1];
            if (!publisher) {
                throw new Error('No active account-notifications publisher to push a notification through');
            }
            publisher.publish('notification', notification);
        },
        rpcSubscriptions,
    };
}

function makeWrapper({
    rpc,
    rpcSubscriptions,
}: {
    rpc: Rpc<SolanaRpcApiMainnet>;
    rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
}) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <Theme>
                <SWRConfig value={{ provider: () => new Map() }}>
                    <ChainContext.Provider value={DEFAULT_CHAIN_CONFIG}>
                        <RpcContext.Provider value={{ rpc, rpcSubscriptions }}>{children}</RpcContext.Provider>
                    </ChainContext.Provider>
                </SWRConfig>
            </Theme>
        );
    };
}

describe('Balance', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders an em-dash while the balance is loading', () => {
        const { rpc } = makeMockRpc();
        const { rpcSubscriptions } = makeMockSubscriptions();
        const { container } = render(<Balance account={makeAccount()} />, {
            wrapper: makeWrapper({ rpc, rpcSubscriptions }),
        });
        // En-dash `\u2013` is used in the loading state.
        expect(container.textContent).toBe('\u2013');
    });

    it('formats the resolved lamports value as SOL', async () => {
        const { rpc, resolveGetBalance } = makeMockRpc();
        const { rpcSubscriptions } = makeMockSubscriptions();
        const { container } = render(<Balance account={makeAccount()} />, {
            wrapper: makeWrapper({ rpc, rpcSubscriptions }),
        });
        await act(async () => {
            resolveGetBalance(lamportsResponse(100, 1_500_000_000n));
            await jest.runAllTimersAsync();
        });
        // Allow SWR's cache propagation to flush.
        await waitFor(() => expect(container.textContent ?? '').toContain('\u25CE'));
        expect(container.textContent).toBe('1.5 \u25CE');
    });

    it('reflects a newer account notification over the initial balance', async () => {
        const { rpc, resolveGetBalance } = makeMockRpc();
        const { rpcSubscriptions, pushNotification } = makeMockSubscriptions();
        const { container } = render(<Balance account={makeAccount()} />, {
            wrapper: makeWrapper({ rpc, rpcSubscriptions }),
        });
        await act(async () => {
            resolveGetBalance(lamportsResponse(100, 1_000_000_000n));
            await jest.runAllTimersAsync();
        });
        await waitFor(() => expect(container.textContent).toBe('1 \u25CE'));

        await act(async () => {
            pushNotification({ context: { slot: 200n }, value: { lamports: 2_500_000_000n as Lamports } });
            await jest.runAllTimersAsync();
        });
        await waitFor(() => expect(container.textContent).toBe('2.5 \u25CE'));
    });

    it('shows the error indicator (warning glyph) when the balance fetch fails', async () => {
        const { rpc, rejectGetBalance } = makeMockRpc();
        const { rpcSubscriptions } = makeMockSubscriptions();
        const { container } = render(<Balance account={makeAccount()} />, {
            wrapper: makeWrapper({ rpc, rpcSubscriptions }),
        });
        await act(async () => {
            rejectGetBalance(new Error('rpc-down'));
            await jest.runAllTimersAsync();
        });
        await waitFor(() => expect(container.querySelector('svg')).not.toBeNull());
    });
});
