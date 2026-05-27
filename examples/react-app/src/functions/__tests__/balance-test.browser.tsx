import type {
    AccountNotificationsApi,
    Address,
    GetBalanceApi,
    Lamports,
    Rpc,
    RpcSubscriptions,
    SolanaRpcResponse,
} from '@solana/kit';
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

function createMockRpc() {
    const { promise, resolve, reject } = Promise.withResolvers<LamportsResponse>();
    const send = jest.fn().mockReturnValue(promise);
    const getBalance = jest.fn().mockReturnValue({ send });
    return {
        getBalance,
        rejectGetBalance: reject,
        resolveGetBalance: resolve,
        rpc: { getBalance } as unknown as Rpc<GetBalanceApi>,
    };
}

function createMockSubscriptions() {
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
    const accountNotifications = jest.fn().mockReturnValue({ subscribe });
    return {
        accountNotifications,
        pushNotification(notification: AccountNotification) {
            if (waiting) {
                const resolve = waiting;
                waiting = null;
                resolve({ done: false, value: notification });
            } else {
                queue.push(notification);
            }
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
