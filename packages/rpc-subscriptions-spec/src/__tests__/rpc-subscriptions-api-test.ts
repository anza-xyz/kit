import { createRpcSubscriptionsApi, RpcSubscriptionsPlan } from '../rpc-subscriptions-api';
import { RpcSubscriptionsChannel } from '../rpc-subscriptions-channel';

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

describe('createRpcSubscriptionsApi', () => {
    let mockChannel: RpcSubscriptionsChannel<unknown, unknown>;
    beforeEach(() => {
        mockChannel = { on: jest.fn(), send: jest.fn() };
    });
    describe('execute', () => {
        it('calls the plan executor with the expected params', () => {
            const mockPlanExecutor = jest.fn().mockResolvedValue({
                execute: jest.fn(),
                request: { methodName: 'foo', params: [] },
            } as RpcSubscriptionsPlan<unknown>);
            const api = createRpcSubscriptionsApi({ planExecutor: mockPlanExecutor });
            const expectedParams = [1, 'hi', 3];
            const expectedSignal = new AbortController().signal;
            api.foo(...expectedParams)
                .execute({
                    channel: mockChannel,
                    signal: expectedSignal,
                })
                .catch(() => {});
            expect(mockPlanExecutor).toHaveBeenCalledWith({
                channel: mockChannel,
                request: { methodName: 'foo', params: expectedParams },
                signal: expectedSignal,
            });
        });
    });
    describe('rpcRequest', () => {
        it('provides the initial request object by default', () => {
            const api = createRpcSubscriptionsApi({ planExecutor: jest.fn() });
            const result = api.foo('hi');
            expect(result.request).toEqual({ methodName: 'foo', params: ['hi'] });
        });
        it('provides the transformed request object when a request transformer is provided', () => {
            const api = createRpcSubscriptionsApi({
                planExecutor: jest.fn(),
                requestTransformer: jest.fn().mockReturnValue({ methodName: 'bar', params: [1, 2, 3] }),
            });
            const result = api.foo('hi');
            expect(result.request).toEqual({ methodName: 'bar', params: [1, 2, 3] });
        });
    });
    it('does not expose JS protocol string hooks as subscription methods', () => {
        expect.assertions(2);
        const api = createRpcSubscriptionsApi({ planExecutor: jest.fn() });

        expect(api).not.toHaveProperty('then');
        expect(api).not.toHaveProperty('toJSON');
    });
    it.each(JAVASCRIPT_PROTOCOL_SYMBOLS)('does not expose $name as a subscription method', ({ symbol }) => {
        const api = createRpcSubscriptionsApi({ planExecutor: jest.fn() });

        expect(getUntypedProperty(api, symbol)).toBeUndefined();
    });
    it('preserves Object prototype behavior', () => {
        expect.assertions(2);
        const api = createRpcSubscriptionsApi({ planExecutor: jest.fn() });

        expect(String(api)).toBe('[object Object]');
        expect(getUntypedProperty(api, 'hasOwnProperty')).toBe(Object.prototype.hasOwnProperty);
    });
});
