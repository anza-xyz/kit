import { DataPublisher } from '@solana/subscribable';

import { createSubscriptionRpc, type RpcSubscriptions } from '../rpc-subscriptions';
import { RpcSubscriptionsTransport } from '../rpc-subscriptions-transport';

interface TestRpcSubscriptionNotifications {
    thingNotifications(...args: unknown[]): { value: number };
}

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
