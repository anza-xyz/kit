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
import { ClientProvider } from '@solana/react';
import { act, waitFor } from '@testing-library/react';
import type { UiWalletAccount } from '@wallet-standard/ui';
import React from 'react';
import { SWRConfig } from 'swr';

import { render } from '../../__test-utils__/render';
import { DEFAULT_CHAIN_CONFIG } from '../../context/ChainContext';
import type { AppClient } from '../../context/ClientProvider';
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
    function latestPublisher(action: string) {
        const publisher = publishers[publishers.length - 1];
        if (!publisher) {
            throw new Error(`No active account-notifications publisher to ${action}`);
        }
        return publisher;
    }
    return {
        pushError(error: unknown) {
            latestPublisher('push an error through').publish('error', error);
        },
        pushNotification(notification: AccountNotification) {
            latestPublisher('push a notification through').publish('notification', notification);
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
    const client = { chain: DEFAULT_CHAIN_CONFIG.chain, rpc, rpcSubscriptions } as unknown as AppClient;
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <Theme>
                <SWRConfig value={{ provider: () => new Map() }}>
                    <ClientProvider client={client}>{children}</ClientProvider>
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

    it('refetches against the new client when the network (client) switches', async () => {
        const swrCache = new Map();
        const provider = () => swrCache;
        const devnet = makeMockRpc();
        const testnet = makeMockRpc();
        const devnetSubscriptions = makeMockSubscriptions();
        const testnetSubscriptions = makeMockSubscriptions();
        const devnetClient = {
            chain: 'solana:devnet',
            rpc: devnet.rpc,
            rpcSubscriptions: devnetSubscriptions.rpcSubscriptions,
        } as unknown as AppClient;
        const testnetClient = {
            chain: 'solana:testnet',
            rpc: testnet.rpc,
            rpcSubscriptions: testnetSubscriptions.rpcSubscriptions,
        } as unknown as AppClient;
        const tree = (client: AppClient) => (
            <Theme>
                <SWRConfig value={{ provider }}>
                    <ClientProvider client={client}>
                        <Balance account={makeAccount()} />
                    </ClientProvider>
                </SWRConfig>
            </Theme>
        );

        const { container, rerender } = render(tree(devnetClient));
        await act(async () => {
            devnet.resolveGetBalance(lamportsResponse(100, 1_000_000_000n));
            await jest.runAllTimersAsync();
        });
        await waitFor(() => expect(container.textContent).toBe('1 ◎'));

        // Switch networks. `ClientProvider` rebuilds the client per chain and stamps the new `chain`
        // onto it, so `Balance`'s SWR key (derived from `client.chain`) changes and the subscription
        // rebinds to the new client's rpc — resolving *only* the testnet fetch drives the UI. Were the
        // key derived from an eagerly-updated chain source rather than the client, the subscription
        // would stay bound to the devnet rpc and this would remain `1 ◎`.
        rerender(tree(testnetClient));
        await act(async () => {
            testnet.resolveGetBalance(lamportsResponse(200, 2_000_000_000n));
            await jest.runAllTimersAsync();
        });
        await waitFor(() => expect(container.textContent).toBe('2 ◎'));
    });

    it('keeps showing the last known balance when the subscription later errors', async () => {
        const { rpc, resolveGetBalance } = makeMockRpc();
        const { rpcSubscriptions, pushError } = makeMockSubscriptions();
        const { container } = render(<Balance account={makeAccount()} />, {
            wrapper: makeWrapper({ rpc, rpcSubscriptions }),
        });
        await act(async () => {
            resolveGetBalance(lamportsResponse(100, 1_000_000_000n));
            await jest.runAllTimersAsync();
        });
        await waitFor(() => expect(container.textContent).toBe('1 ◎'));

        await act(async () => {
            pushError(new Error('subscription-dropped'));
            await jest.runAllTimersAsync();
        });
        // Stale-while-error: the cached balance stays visible and a warning glyph appears beside it,
        // rather than the error wiping out the last known value.
        await waitFor(() => expect(container.querySelector('svg')).not.toBeNull());
        expect(container.textContent).toBe('1 ◎');
    });
});
