import { SOLANA_ERROR__RPC_SUBSCRIPTIONS__CANNOT_CREATE_SUBSCRIPTION_PLAN, SolanaError } from '@solana/errors';
import { DataPublisher } from '@solana/subscribable';

import { createSubscriptionRpc, type RpcSubscriptions } from '../rpc-subscriptions';
import { RpcSubscriptionsTransport } from '../rpc-subscriptions-transport';

interface TestRpcSubscriptionNotifications {
    thingNotifications(...args: unknown[]): { value: number };
}

describe('createSubscriptionRpc', () => {
    let rpcSubscriptions: RpcSubscriptions<TestRpcSubscriptionNotifications>;

    beforeEach(() => {
        rpcSubscriptions = createSubscriptionRpc<TestRpcSubscriptionNotifications>({
            // @ts-expect-error Does not implement API on purpose
            api: {},
            transport: jest.fn(),
        });
    });

    it('throws when the API produces no subscription plan', () => {
        expect(() => {
            rpcSubscriptions.thingNotifications();
        }).toThrow(
            new SolanaError(SOLANA_ERROR__RPC_SUBSCRIPTIONS__CANNOT_CREATE_SUBSCRIPTION_PLAN, {
                notificationName: 'thingNotifications',
            }),
        );
    });

    it('should not be thenable', () => {
        expect(rpcSubscriptions).not.toHaveProperty('then');
    });
});

describe('PendingRpcSubscriptionsRequest.reactive()', () => {
    let mockTransport: jest.MockedFunction<RpcSubscriptionsTransport>;
    let mockOn: jest.Mock;
    let mockDataPublisher: DataPublisher;
    let rpcSubscriptions: RpcSubscriptions<TestRpcSubscriptionNotifications>;
    function publish(type: string, payload: unknown) {
        mockOn.mock.calls.filter(([actualType]) => actualType === type).forEach(([_, listener]) => listener(payload));
    }
    beforeEach(() => {
        mockOn = jest.fn().mockReturnValue(function unsubscribe() {});
        mockDataPublisher = { on: mockOn };
        mockTransport = jest.fn().mockResolvedValue(mockDataPublisher);
        rpcSubscriptions = createSubscriptionRpc<TestRpcSubscriptionNotifications>({
            api: {
                thingNotifications(...args: unknown[]) {
                    return {
                        execute: jest.fn().mockResolvedValue(mockDataPublisher),
                        request: { methodName: 'thingNotifications', params: args },
                    };
                },
            },
            transport: mockTransport,
        });
    });

    it('passes the abort signal to the transport', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        await rpcSubscriptions.thingNotifications().reactive({ abortSignal: abortController.signal });
        expect(mockTransport).toHaveBeenCalledWith(expect.objectContaining({ signal: abortController.signal }));
    });
    it('returns a store whose getState() starts as undefined', async () => {
        expect.assertions(1);
        const store = await rpcSubscriptions
            .thingNotifications()
            .reactive({ abortSignal: new AbortController().signal });
        expect(store.getState()).toBeUndefined();
    });
    it('returns a store whose getState() reflects incoming notifications', async () => {
        expect.assertions(1);
        const store = await rpcSubscriptions
            .thingNotifications()
            .reactive({ abortSignal: new AbortController().signal });
        publish('notification', { value: 42 });
        expect(store.getState()).toStrictEqual({ value: 42 });
    });
    it('calls store subscribers when a notification arrives', async () => {
        expect.assertions(1);
        const store = await rpcSubscriptions
            .thingNotifications()
            .reactive({ abortSignal: new AbortController().signal });
        const subscriber = jest.fn();
        store.subscribe(subscriber);
        publish('notification', { value: 42 });
        expect(subscriber).toHaveBeenCalledTimes(1);
    });
    it('surfaces errors via getError()', async () => {
        expect.assertions(2);
        const store = await rpcSubscriptions
            .thingNotifications()
            .reactive({ abortSignal: new AbortController().signal });
        expect(store.getError()).toBeUndefined();
        const error = new Error('o no');
        publish('error', error);
        expect(store.getError()).toBe(error);
    });
});

describe('PendingRpcSubscriptionsRequest.reactiveStore()', () => {
    let mockTransport: jest.MockedFunction<RpcSubscriptionsTransport>;
    let mockOn: jest.Mock;
    let mockDataPublisher: DataPublisher;
    let rpcSubscriptions: RpcSubscriptions<TestRpcSubscriptionNotifications>;
    function publish(type: string, payload: unknown) {
        mockOn.mock.calls.filter(([actualType]) => actualType === type).forEach(([_, listener]) => listener(payload));
    }
    // Two ticks: one for the `createDataPublisher()` promise to resolve inside `connect()`,
    // one for the `.then` handler that wires up the `on(...)` listeners.
    async function flushMicrotasks() {
        await Promise.resolve();
        await Promise.resolve();
    }
    beforeEach(() => {
        mockOn = jest.fn().mockReturnValue(function unsubscribe() {});
        mockDataPublisher = { on: mockOn };
        mockTransport = jest.fn().mockResolvedValue(mockDataPublisher);
        rpcSubscriptions = createSubscriptionRpc<TestRpcSubscriptionNotifications>({
            api: {
                thingNotifications(...args: unknown[]) {
                    return {
                        execute: jest.fn().mockResolvedValue(mockDataPublisher),
                        request: { methodName: 'thingNotifications', params: args },
                    };
                },
            },
            transport: mockTransport,
        });
    });

    it('passes the abort signal to the transport', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        rpcSubscriptions.thingNotifications().reactiveStore({ abortSignal: abortController.signal });
        await flushMicrotasks();
        expect(mockTransport).toHaveBeenCalledWith(expect.objectContaining({ signal: abortController.signal }));
    });
    it('returns a store that starts in `loading` status before the transport resolves', () => {
        const store = rpcSubscriptions
            .thingNotifications()
            .reactiveStore({ abortSignal: new AbortController().signal });
        expect(store.getUnifiedState()).toStrictEqual({
            data: undefined,
            error: undefined,
            status: 'loading',
        });
    });
    it('returns a store whose state reflects incoming notifications', async () => {
        expect.assertions(1);
        const store = rpcSubscriptions
            .thingNotifications()
            .reactiveStore({ abortSignal: new AbortController().signal });
        await flushMicrotasks();
        publish('notification', { value: 42 });
        expect(store.getUnifiedState()).toStrictEqual({
            data: { value: 42 },
            error: undefined,
            status: 'loaded',
        });
    });
    it('calls store subscribers when a notification arrives', async () => {
        expect.assertions(1);
        const store = rpcSubscriptions
            .thingNotifications()
            .reactiveStore({ abortSignal: new AbortController().signal });
        await flushMicrotasks();
        const subscriber = jest.fn();
        store.subscribe(subscriber);
        publish('notification', { value: 42 });
        expect(subscriber).toHaveBeenCalledTimes(1);
    });
    it('surfaces errors via getUnifiedState()', async () => {
        expect.assertions(1);
        const store = rpcSubscriptions
            .thingNotifications()
            .reactiveStore({ abortSignal: new AbortController().signal });
        await flushMicrotasks();
        const error = new Error('o no');
        publish('error', error);
        expect(store.getUnifiedState()).toStrictEqual({
            data: undefined,
            error,
            status: 'error',
        });
    });
    it('re-invokes the transport on retry() after an error', async () => {
        expect.assertions(1);
        const store = rpcSubscriptions
            .thingNotifications()
            .reactiveStore({ abortSignal: new AbortController().signal });
        await flushMicrotasks();
        publish('error', new Error('stream died'));
        store.retry();
        await flushMicrotasks();
        expect(mockTransport).toHaveBeenCalledTimes(2);
    });
    it('aborts the signal forwarded to the data publisher listeners when the caller aborts', async () => {
        expect.assertions(2);
        const abortController = new AbortController();
        rpcSubscriptions.thingNotifications().reactiveStore({ abortSignal: abortController.signal });
        await flushMicrotasks();
        const onCall = mockOn.mock.calls.find(([channel]: [string]) => channel === 'notification');
        const listenerSignal = (onCall![2] as { signal: AbortSignal }).signal;
        expect(listenerSignal.aborted).toBe(false);
        abortController.abort();
        expect(listenerSignal.aborted).toBe(true);
    });
    it('returns the same getUnifiedState() snapshot across consecutive calls when state has not changed', async () => {
        expect.assertions(2);
        const store = rpcSubscriptions
            .thingNotifications()
            .reactiveStore({ abortSignal: new AbortController().signal });
        await flushMicrotasks();
        expect(store.getUnifiedState()).toBe(store.getUnifiedState());
        publish('notification', { value: 42 });
        expect(store.getUnifiedState()).toBe(store.getUnifiedState());
    });
});
