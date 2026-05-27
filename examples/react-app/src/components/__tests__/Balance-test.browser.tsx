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

function makeMockRpc() {
    const { promise, resolve, reject } = Promise.withResolvers<LamportsResponse>();
    const send = jest.fn().mockReturnValue(promise);
    return {
        rejectGetBalance: reject,
        resolveGetBalance: resolve,
        rpc: { getBalance: jest.fn().mockReturnValue({ send }) } as unknown as Rpc<SolanaRpcApiMainnet>,
    };
}

function makeMockSubscriptions() {
    const queue: AccountNotification[] = [];
    let waiting: ((value: IteratorResult<AccountNotification>) => void) | null = null;
    const asyncIterable: AsyncIterable<AccountNotification> = {
        [Symbol.asyncIterator]() {
            return {
                next() {
                    if (queue.length > 0) {
                        return Promise.resolve({ done: false, value: queue.shift()! } as const);
                    }
                    return new Promise<IteratorResult<AccountNotification>>(resolve => {
                        waiting = resolve;
                    });
                },
            };
        },
    };
    const subscribe = jest.fn().mockResolvedValue(asyncIterable);
    const rpcSubscriptions = {
        accountNotifications: jest.fn().mockReturnValue({ subscribe }),
    } as unknown as RpcSubscriptions<AccountNotificationsApi & SolanaRpcSubscriptionsApi>;
    return {
        pushNotification(notification: AccountNotification) {
            if (waiting) {
                const resolve = waiting;
                waiting = null;
                resolve({ done: false, value: notification });
            } else {
                queue.push(notification);
            }
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
