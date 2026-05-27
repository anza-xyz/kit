import type {
    AccountNotificationsApi,
    Address,
    GetBalanceApi,
    Lamports,
    Rpc,
    RpcSubscriptions,
    SolanaRpcResponse,
} from '@solana/kit';
import { createReactiveActionStore, createReactiveStoreFromDataPublisherFactory } from '@solana/kit';
import { act } from '@testing-library/react';

import { balanceSubscribe } from '../balance';

type LamportsResponse = SolanaRpcResponse<Lamports>;
type AccountNotification = SolanaRpcResponse<{ lamports: Lamports }>;

function lamportsResponse(slot: number, lamports: bigint): LamportsResponse {
    return { context: { slot: BigInt(slot) }, value: lamports as Lamports };
}

function accountNotification(slot: number, lamports: bigint): AccountNotification {
    return { context: { slot: BigInt(slot) }, value: { lamports: lamports as Lamports } };
}

// `balanceSubscribe` consumes the RPC request via its `reactiveStore()` method (not `send()`), so
// the mock backs `getBalance(...)` with a real `ReactiveActionStore` wrapping a controllable
// promise. `resolveGetBalance` / `rejectGetBalance` settle the initial fetch on demand.
function createMockRpc() {
    const { promise, resolve, reject } = Promise.withResolvers<LamportsResponse>();
    const execute = jest.fn().mockReturnValue(promise);
    const getBalance = jest.fn().mockReturnValue({
        reactiveStore: () => createReactiveActionStore(execute),
    });
    return {
        getBalance,
        rejectGetBalance: reject,
        resolveGetBalance: resolve,
        rpc: { getBalance } as unknown as Rpc<GetBalanceApi>,
    };
}

// `balanceSubscribe` consumes the subscription via its `reactiveStore()` method (not `subscribe()`),
// so the mock backs `accountNotifications(...)` with a real `ReactiveStreamStore` built from a mock
// `DataPublisher` factory. The factory hands out a fresh publisher per connection; `pushNotification`
// emits onto the most recent one through the same `'notification'` channel the real RPC uses.
function createMockSubscriptions() {
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
    const accountNotifications = jest.fn().mockReturnValue({
        reactiveStore: () =>
            createReactiveStoreFromDataPublisherFactory<AccountNotification>({
                createDataPublisher,
                dataChannelName: 'notification',
                errorChannelName: 'error',
            }),
    });
    return {
        accountNotifications,
        pushNotification(notification: AccountNotification) {
            const publisher = publishers[publishers.length - 1];
            if (!publisher) {
                throw new Error('No active account-notifications publisher to push a notification through');
            }
            publisher.publish('notification', notification);
        },
        rpcSubscriptions: { accountNotifications } as unknown as RpcSubscriptions<AccountNotificationsApi>,
    };
}

const FAKE_ADDRESS = 'So11111111111111111111111111111111111111112' as Address;

function startSubscribe(rpc: Rpc<GetBalanceApi>, rpcSubscriptions: RpcSubscriptions<AccountNotificationsApi>) {
    const next = jest.fn();
    const cleanup = balanceSubscribe(rpc, rpcSubscriptions, { address: FAKE_ADDRESS }, { next });
    return { cleanup, next };
}

describe('balanceSubscribe', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    it('requests `getBalance` with the `confirmed` commitment', () => {
        const { rpc, getBalance } = createMockRpc();
        const { rpcSubscriptions } = createMockSubscriptions();
        startSubscribe(rpc, rpcSubscriptions);
        expect(getBalance).toHaveBeenCalledWith(FAKE_ADDRESS, { commitment: 'confirmed' });
    });

    it('opens the account-notifications subscription for the same address', () => {
        const { rpc } = createMockRpc();
        const { rpcSubscriptions, accountNotifications } = createMockSubscriptions();
        startSubscribe(rpc, rpcSubscriptions);
        expect(accountNotifications).toHaveBeenCalledWith(FAKE_ADDRESS);
    });

    it('publishes the initial RPC lamports value through `next`', async () => {
        const { rpc, resolveGetBalance } = createMockRpc();
        const { rpcSubscriptions } = createMockSubscriptions();
        const { next } = startSubscribe(rpc, rpcSubscriptions);

        await act(async () => {
            resolveGetBalance(lamportsResponse(100, 42n));
            await jest.runAllTimersAsync();
        });
        expect(next).toHaveBeenCalledWith(null, 42n);
    });

    it('promotes a newer subscription notification over the initial RPC value', async () => {
        const { rpc, resolveGetBalance } = createMockRpc();
        const { rpcSubscriptions, pushNotification } = createMockSubscriptions();
        const { next } = startSubscribe(rpc, rpcSubscriptions);

        await act(async () => {
            resolveGetBalance(lamportsResponse(100, 1n));
            await jest.runAllTimersAsync();
        });
        await act(async () => {
            pushNotification(accountNotification(200, 2n));
            await jest.runAllTimersAsync();
        });
        expect(next).toHaveBeenLastCalledWith(null, 2n);
    });

    it('drops a stale subscription notification with an older slot', async () => {
        const { rpc, resolveGetBalance } = createMockRpc();
        const { rpcSubscriptions, pushNotification } = createMockSubscriptions();
        const { next } = startSubscribe(rpc, rpcSubscriptions);

        await act(async () => {
            resolveGetBalance(lamportsResponse(200, 99n));
            await jest.runAllTimersAsync();
        });
        const callsAfterRpc = next.mock.calls.length;
        await act(async () => {
            // Older slot — the store should ignore this and `next` should not fire again.
            pushNotification(accountNotification(150, 5n));
            await jest.runAllTimersAsync();
        });
        expect(next.mock.calls).toHaveLength(callsAfterRpc);
        expect(next).toHaveBeenLastCalledWith(null, 99n);
    });

    it('publishes errors from the initial RPC through `next`', async () => {
        const { rpc, rejectGetBalance } = createMockRpc();
        const { rpcSubscriptions } = createMockSubscriptions();
        const { next } = startSubscribe(rpc, rpcSubscriptions);

        const boom = new Error('rpc-down');
        await act(async () => {
            rejectGetBalance(boom);
            await jest.runAllTimersAsync();
        });
        expect(next).toHaveBeenCalledWith(boom);
    });
});
