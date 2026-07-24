import { SOLANA_ERROR__RPC_SUBSCRIPTIONS__CANNOT_CREATE_SUBSCRIPTION_PLAN, SolanaError } from '@solana/errors';
import { DataPublisher } from '@solana/subscribable';

import { createSubscriptionRpc, type RpcSubscriptions } from '../rpc-subscriptions';
import { RpcSubscriptionsTransport } from '../rpc-subscriptions-transport';

interface TestRpcSubscriptionNotifications {
    thingNotifications(...args: unknown[]): { value: number };
}

function getUntypedProperty(obj: unknown, propertyName: PropertyKey): unknown {
    return (obj as Record<PropertyKey, unknown>)[propertyName];
}

const JAVASCRIPT_PROTOCOL_SYMBOLS = [
    { name: 'Symbol.asyncIterator', symbol: Symbol.asyncIterator },
    { name: 'Symbol.asyncDispose', symbol: Symbol.asyncDispose },
    { name: 'Symbol.dispose', symbol: Symbol.dispose },
    { name: 'Symbol.for(nodejs.util.inspect.custom)', symbol: Symbol.for('nodejs.util.inspect.custom') },
    { name: 'Symbol.iterator', symbol: Symbol.iterator },
    { name: 'Symbol.toPrimitive', symbol: Symbol.toPrimitive },
    { name: 'Symbol.toStringTag', symbol: Symbol.toStringTag },
].filter(({ symbol }) => symbol != null);

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

    it('does not expose JSON serialization as a subscription method', () => {
        expect.assertions(2);
        expect(rpcSubscriptions).not.toHaveProperty('toJSON');
        expect(JSON.stringify(rpcSubscriptions)).toBe('{}');
    });

    it.each(JAVASCRIPT_PROTOCOL_SYMBOLS)('does not expose $name as a subscription method', ({ symbol }) => {
        expect.assertions(1);
        expect(getUntypedProperty(rpcSubscriptions, symbol)).toBeUndefined();
    });

    it('preserves Object prototype behavior', () => {
        expect.assertions(2);
        expect(String(rpcSubscriptions)).toBe('[object Object]');
        expect(getUntypedProperty(rpcSubscriptions, 'hasOwnProperty')).toBe(Object.prototype.hasOwnProperty);
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

    it('returns a store that starts in `idle` status and does not call the transport before connect()', () => {
        const store = rpcSubscriptions.thingNotifications().reactiveStore();
        expect(store.getState()).toStrictEqual({
            data: undefined,
            error: undefined,
            status: 'idle',
        });
        expect(mockTransport).not.toHaveBeenCalled();
    });
    it('passes the per-connection signal to the transport on withSignal().connect()', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        const store = rpcSubscriptions.thingNotifications().reactiveStore();
        store.withSignal(abortController.signal).connect();
        await flushMicrotasks();
        const transportSignal = mockTransport.mock.calls[0][0].signal;
        // The transport receives a composed signal — aborting the caller's source aborts it.
        expect(transportSignal.aborted).toBe(false);
    });
    it('transitions to `loading` after connect() before the transport resolves', () => {
        const store = rpcSubscriptions.thingNotifications().reactiveStore();
        store.connect();
        expect(store.getState()).toStrictEqual({
            data: undefined,
            error: undefined,
            status: 'loading',
        });
    });
    it('reflects incoming notifications after connect()', async () => {
        expect.assertions(1);
        const store = rpcSubscriptions.thingNotifications().reactiveStore();
        store.connect();
        await flushMicrotasks();
        publish('notification', { value: 42 });
        expect(store.getState()).toStrictEqual({
            data: { value: 42 },
            error: undefined,
            status: 'loaded',
        });
    });
    it('calls store subscribers when a notification arrives', async () => {
        expect.assertions(1);
        const store = rpcSubscriptions.thingNotifications().reactiveStore();
        store.connect();
        await flushMicrotasks();
        const subscriber = jest.fn();
        store.subscribe(subscriber);
        publish('notification', { value: 42 });
        expect(subscriber).toHaveBeenCalledTimes(1);
    });
    it('surfaces errors via getState()', async () => {
        expect.assertions(1);
        const store = rpcSubscriptions.thingNotifications().reactiveStore();
        store.connect();
        await flushMicrotasks();
        const error = new Error('o no');
        publish('error', error);
        expect(store.getState()).toStrictEqual({
            data: undefined,
            error,
            status: 'error',
        });
    });
    it('re-invokes the transport on connect() after an error', async () => {
        expect.assertions(1);
        const store = rpcSubscriptions.thingNotifications().reactiveStore();
        store.connect();
        await flushMicrotasks();
        publish('error', new Error('stream died'));
        store.connect();
        await flushMicrotasks();
        expect(mockTransport).toHaveBeenCalledTimes(2);
    });
    it('aborts the signal forwarded to the data publisher listeners when the caller signal aborts', async () => {
        expect.assertions(2);
        const abortController = new AbortController();
        const store = rpcSubscriptions.thingNotifications().reactiveStore();
        store.withSignal(abortController.signal).connect();
        await flushMicrotasks();
        const onCall = mockOn.mock.calls.find(([channel]: [string]) => channel === 'notification');
        const listenerSignal = (onCall![2] as { signal: AbortSignal }).signal;
        expect(listenerSignal.aborted).toBe(false);
        abortController.abort();
        expect(listenerSignal.aborted).toBe(true);
    });
    it('returns the same getState() snapshot across consecutive calls when state has not changed', async () => {
        expect.assertions(2);
        const store = rpcSubscriptions.thingNotifications().reactiveStore();
        store.connect();
        await flushMicrotasks();
        expect(store.getState()).toBe(store.getState());
        publish('notification', { value: 42 });
        expect(store.getState()).toBe(store.getState());
    });
});
