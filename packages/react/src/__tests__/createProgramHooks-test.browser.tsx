import {
    type Address,
    createReactiveActionStore,
    createReactiveStoreFromDataPublisherFactory,
    getBase64Decoder,
    type ReadonlyUint8Array,
} from '@solana/kit';
import { act, waitFor } from '@testing-library/react';
import React, { type ReactNode } from 'react';

import { render, renderHook } from '../__test-utils__/render';
import { ClientProvider } from '../ClientProvider';
import { createProgramHooks } from '../createProgramHooks';

type CounterAccount = { count: number };

type CounterPlugin = {
    accounts: {
        counter: {
            decode: (bytes: ReadonlyUint8Array) => CounterAccount;
            fetch: (address: Address) => Promise<{ address: Address; data: CounterAccount }>;
            fetchAll: (addresses: Address[]) => Promise<{ address: Address; data: CounterAccount }[]>;
            fetchAllMaybe: (
                addresses: Address[],
            ) => Promise<{ address: Address; data?: CounterAccount; exists: boolean }[]>;
            fetchMaybe: (address: Address) => Promise<{ address: Address; data?: CounterAccount; exists: boolean }>;
        };
    };
    instructions: {
        increment: (input: { by: number }) => {
            sendTransaction: (config?: { abortSignal?: AbortSignal; commitment?: string }) => Promise<string>;
        };
    };
    pdas: {
        counter: (seeds: { owner: Address }) => Promise<[Address, number]>;
    };
};

const ADDRESS = '11111111111111111111111111111111' as Address;
const OTHER_ADDRESS = 'SysvarC1ock11111111111111111111111111111111' as Address;

const hooks = createProgramHooks<{ counter: CounterPlugin }>('counter');

function encodeCount(count: number): string {
    return getBase64Decoder().decode(new Uint8Array([count]));
}

function accountValue(count: number) {
    return { data: [encodeCount(count), 'base64'] as const };
}

type Emit = (notification: { context: { slot: bigint }; value: ReturnType<typeof accountValue> }) => void;

let emit: Emit;
let fetchMock: jest.Mock;
let fetchAllMock: jest.Mock;
let fetchMaybeMock: jest.Mock;
let fetchAllMaybeMock: jest.Mock;
let sendTransactionMock: jest.Mock;
let incrementMock: jest.Mock;
let pdaMock: jest.Mock;
let initialSlot: bigint;
let initialValue: ReturnType<typeof accountValue> | null;

function createClient() {
    const namespace = {
        accounts: {
            counter: {
                decode: (bytes: ReadonlyUint8Array): CounterAccount => ({ count: bytes[0] ?? 0 }),
                fetch: fetchMock,
                fetchAll: fetchAllMock,
                fetchAllMaybe: fetchAllMaybeMock,
                fetchMaybe: fetchMaybeMock,
            },
        },
        instructions: { increment: incrementMock },
        pdas: { counter: pdaMock },
    };
    return {
        counter: namespace,
        rpc: {
            getAccountInfo: () => ({
                reactiveStore: () =>
                    createReactiveActionStore(() =>
                        Promise.resolve({ context: { slot: initialSlot }, value: initialValue }),
                    ),
            }),
        },
        rpcSubscriptions: {
            accountNotifications: () => ({
                reactiveStore: () =>
                    createReactiveStoreFromDataPublisherFactory({
                        createDataPublisher: (signal: AbortSignal) =>
                            Promise.resolve({
                                on: (channelName: string, subscriber: (data: unknown) => void) => {
                                    if (channelName === 'notification') {
                                        emit = subscriber as Emit;
                                    }
                                    signal.addEventListener('abort', () => {
                                        emit = () => {};
                                    });
                                    return () => {};
                                },
                            }),
                        dataChannelName: 'notification',
                        errorChannelName: 'error',
                    }),
            }),
        },
    };
}

let client: ReturnType<typeof createClient>;

function wrapper({ children }: { children: ReactNode }) {
    return <ClientProvider client={client as never}>{children}</ClientProvider>;
}

beforeEach(() => {
    emit = () => {};
    initialSlot = 1n;
    initialValue = accountValue(1);
    fetchMock = jest.fn((address: Address) => Promise.resolve({ address, data: { count: 7 } }));
    fetchAllMock = jest.fn((addresses: Address[]) =>
        Promise.resolve(addresses.map(address => ({ address, data: { count: 7 } }))),
    );
    fetchMaybeMock = jest.fn((address: Address) => Promise.resolve({ address, exists: false }));
    fetchAllMaybeMock = jest.fn((addresses: Address[]) =>
        Promise.resolve(addresses.map(address => ({ address, exists: false }))),
    );
    sendTransactionMock = jest.fn(() => Promise.resolve('signature'));
    incrementMock = jest.fn(() => ({ sendTransaction: sendTransactionMock }));
    pdaMock = jest.fn(() => Promise.resolve([OTHER_ADDRESS, 254] as [Address, number]));
    client = createClient();
});

describe('useTrackedAccount', () => {
    it('decodes the initial fetch with the plugin codec', async () => {
        const { result } = renderHook(() => hooks.useTrackedAccount('counter', ADDRESS), { wrapper });

        await waitFor(() => expect(result.current.status).toBe('loaded'));
        expect(result.current.data?.value).toEqual({ count: 1 });
    });

    it('applies later notifications', async () => {
        const { result } = renderHook(() => hooks.useTrackedAccount('counter', ADDRESS), { wrapper });
        await waitFor(() => expect(result.current.status).toBe('loaded'));

        act(() => emit({ context: { slot: 2n }, value: accountValue(42) }));

        await waitFor(() => expect(result.current.data?.value).toEqual({ count: 42 }));
    });

    it('reports a missing account as null', async () => {
        initialValue = null;
        const { result } = renderHook(() => hooks.useTrackedAccount('counter', ADDRESS), { wrapper });

        await waitFor(() => expect(result.current.status).toBe('loaded'));
        expect(result.current.data?.value).toBeNull();
    });

    it('reports a closed account as null when a notification carries empty data', async () => {
        const { result } = renderHook(() => hooks.useTrackedAccount('counter', ADDRESS), { wrapper });
        await waitFor(() => expect(result.current.data?.value).toEqual({ count: 1 }));

        act(() => emit({ context: { slot: 2n }, value: { data: ['', 'base64'] as const } }));

        await waitFor(() => expect(result.current.data?.value).toBeNull());
        expect(result.current.status).toBe('loaded');
    });

    it('is disabled without an address', () => {
        const { result } = renderHook(() => hooks.useTrackedAccount('counter', null), { wrapper });

        expect(result.current.status).toBe('disabled');
        expect(result.current.data).toBeUndefined();
    });
});

describe('useAccount', () => {
    it('fetches through the plugin and passes the attempt abort signal', async () => {
        const { result } = renderHook(() => hooks.useAccount('counter', ADDRESS), { wrapper });

        await waitFor(() => expect(result.current.status).toBe('success'));
        expect(result.current.data).toEqual({ address: ADDRESS, data: { count: 7 } });
        expect(fetchMock).toHaveBeenCalledWith(ADDRESS, { abortSignal: expect.any(AbortSignal) });
    });

    it('opens no subscription', async () => {
        const accountNotifications = jest.spyOn(client.rpcSubscriptions, 'accountNotifications');
        const { result } = renderHook(() => hooks.useAccount('counter', ADDRESS), { wrapper });

        await waitFor(() => expect(result.current.status).toBe('success'));
        expect(accountNotifications).not.toHaveBeenCalled();
    });

    it('is disabled without an address', () => {
        const { result } = renderHook(() => hooks.useAccount('counter', null), { wrapper });

        expect(result.current.status).toBe('disabled');
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('useMaybeAccount', () => {
    it('reports an absent account rather than rejecting', async () => {
        const { result } = renderHook(() => hooks.useMaybeAccount('counter', ADDRESS), { wrapper });

        await waitFor(() => expect(result.current.status).toBe('success'));
        expect(result.current.data).toEqual({ address: ADDRESS, exists: false });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('useAllAccounts', () => {
    it('does not refetch when the address list is rebuilt with equal contents', async () => {
        const { rerender, result } = renderHook(() => hooks.useAllAccounts('counter', [ADDRESS, OTHER_ADDRESS]), {
            wrapper,
        });

        await waitFor(() => expect(result.current.status).toBe('success'));
        rerender();
        rerender();

        expect(fetchAllMock).toHaveBeenCalledTimes(1);
        expect(result.current.data).toHaveLength(2);
    });
});

describe('useAllMaybeAccounts', () => {
    it('fetches through the plugin', async () => {
        const { result } = renderHook(() => hooks.useAllMaybeAccounts('counter', [ADDRESS]), { wrapper });

        await waitFor(() => expect(result.current.status).toBe('success'));
        expect(result.current.data).toEqual([{ address: ADDRESS, exists: false }]);
        expect(fetchAllMock).not.toHaveBeenCalled();
    });
});

describe('useSendInstruction', () => {
    it('sends the built instruction with the hook abort signal and caller config', async () => {
        const { result } = renderHook(() => hooks.useSendInstruction('increment'), { wrapper });

        await act(async () => {
            await result.current.dispatchAsync({ by: 3 }, { commitment: 'finalized' });
        });

        expect(incrementMock).toHaveBeenCalledWith({ by: 3 });
        const config = sendTransactionMock.mock.calls[0]?.[0] as { abortSignal: AbortSignal; commitment: string };
        expect(config.commitment).toBe('finalized');
        expect(config.abortSignal.aborted).toBe(false);
        await waitFor(() => expect(result.current.data).toBe('signature'));
    });

    it('merges a caller-supplied abort signal with the hook signal', async () => {
        const controller = new AbortController();
        const { result } = renderHook(() => hooks.useSendInstruction('increment'), { wrapper });

        await act(async () => {
            await result.current.dispatchAsync({ by: 3 }, { abortSignal: controller.signal });
        });

        const config = sendTransactionMock.mock.calls[0]?.[0] as { abortSignal: AbortSignal };
        expect(config.abortSignal).not.toBe(controller.signal);
        expect(config.abortSignal.aborted).toBe(false);
        controller.abort();
        expect(config.abortSignal.aborted).toBe(true);
    });
});

describe('usePda', () => {
    it('derives through the plugin', async () => {
        const { result } = renderHook(() => hooks.usePda('counter', { owner: ADDRESS }), { wrapper });

        await waitFor(() => expect(result.current.status).toBe('success'));
        expect(result.current.data).toEqual([OTHER_ADDRESS, 254]);
    });

    it('is disabled without seeds', () => {
        const { result } = renderHook(() => hooks.usePda('counter', null), { wrapper });

        expect(result.current.status).toBe('disabled');
    });
});

it('fails with an actionable error when the client lacks the program plugin', () => {
    const clientWithoutPlugin = { rpc: {}, rpcSubscriptions: {} };
    function Probe() {
        hooks.useAccount('counter', ADDRESS);
        return null;
    }

    expect(() =>
        render(
            <ClientProvider client={clientWithoutPlugin as never}>
                <Probe />
            </ClientProvider>,
        ),
    ).toThrow(/counter/);
});
