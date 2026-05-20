import { SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD, SolanaError } from '@solana/errors';
import { createRpcMessage } from '@solana/rpc-spec-types';

import { createRpc, Rpc } from '../rpc';
import { RpcApi, RpcPlan } from '../rpc-api';
import { RpcTransport } from '../rpc-transport';

interface TestRpcMethods {
    someMethod(...args: unknown[]): unknown;
}

describe('JSON-RPC 2.0', () => {
    let makeHttpRequest: RpcTransport;
    beforeEach(() => {
        makeHttpRequest = jest.fn(
            () =>
                new Promise(_ => {
                    /* never resolve */
                }),
        );
    });
    describe('when no API plan is available for a method', () => {
        let rpc: Rpc<TestRpcMethods>;
        beforeEach(() => {
            rpc = createRpc({
                api: {} as RpcApi<TestRpcMethods>,
                transport: makeHttpRequest,
            });
        });
        it('throws an error', () => {
            expect(() => rpc.someMethod('some', 'params', 123)).toThrow(
                new SolanaError(SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD, {
                    method: 'someMethod',
                    params: ['some', 'params', 123],
                }),
            );
        });
    });
    describe('when using a simple RPC API proxy', () => {
        let rpc: Rpc<TestRpcMethods>;
        beforeEach(() => {
            rpc = createRpc({
                api: new Proxy({} as RpcApi<TestRpcMethods>, {
                    get(_, methodName) {
                        return (...params: unknown[]): RpcPlan<TestRpcMethods> => ({
                            execute: ({ signal, transport }) =>
                                transport({
                                    payload: createRpcMessage({ methodName: methodName.toString(), params }),
                                    signal,
                                }),
                        });
                    },
                }),
                transport: makeHttpRequest,
            });
        });
        it('sends a request to the transport', () => {
            rpc.someMethod(123)
                .send()
                .catch(() => {});
            expect(makeHttpRequest).toHaveBeenCalledWith({
                payload: { ...createRpcMessage({ methodName: 'someMethod', params: [123] }), id: expect.any(String) },
            });
        });
        it('returns results from the transport', async () => {
            expect.assertions(1);
            (makeHttpRequest as jest.Mock).mockResolvedValueOnce(123);
            const result = await rpc.someMethod().send();
            expect(result).toBe(123);
        });
        it('throws errors from the transport', async () => {
            expect.assertions(1);
            const transportError = new Error('o no');
            (makeHttpRequest as jest.Mock).mockRejectedValueOnce(transportError);
            const sendPromise = rpc.someMethod().send();
            await expect(sendPromise).rejects.toThrow(transportError);
        });
        it('should not be thenable', () => {
            expect.assertions(1);
            expect(rpc).not.toHaveProperty('then');
        });
    });
    describe('when calling reactiveStore() on a pending request', () => {
        let execute: jest.Mock;
        let rpc: Rpc<TestRpcMethods>;
        beforeEach(() => {
            jest.useFakeTimers();
            execute = jest.fn(
                () =>
                    new Promise(() => {
                        /* never resolve */
                    }),
            );
            rpc = createRpc({
                api: new Proxy({} as RpcApi<TestRpcMethods>, {
                    get() {
                        return (..._params: unknown[]): RpcPlan<unknown> => ({ execute });
                    },
                }),
                transport: makeHttpRequest,
            });
        });
        afterEach(() => {
            jest.useRealTimers();
        });
        it('fires the request on creation with a non-aborted signal', () => {
            rpc.someMethod(123).reactiveStore();
            expect(execute).toHaveBeenCalledTimes(1);
            const { signal } = execute.mock.calls[0][0];
            expect(signal).toBeInstanceOf(AbortSignal);
            expect(signal.aborted).toBe(false);
        });
        it('forwards the transport to the plan on creation', () => {
            rpc.someMethod(123).reactiveStore();
            expect(execute).toHaveBeenCalledWith(expect.objectContaining({ transport: makeHttpRequest }));
        });
        it('returns a store synchronously in the `running` status', () => {
            const store = rpc.someMethod(123).reactiveStore();
            expect(store.getState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'running',
            });
        });
        it('transitions to `success` with resolved data once the plan resolves', async () => {
            expect.assertions(1);
            const { promise, resolve } = Promise.withResolvers<number>();
            execute.mockReturnValueOnce(promise);
            const store = rpc.someMethod(123).reactiveStore();
            resolve(42);
            await jest.runAllTimersAsync();
            expect(store.getState()).toStrictEqual({
                data: 42,
                error: undefined,
                status: 'success',
            });
        });
        it('transitions to `error` when the plan rejects', async () => {
            expect.assertions(1);
            const { promise, reject } = Promise.withResolvers<number>();
            execute.mockReturnValueOnce(promise);
            const store = rpc.someMethod(123).reactiveStore();
            const error = new Error('o no');
            reject(error);
            await jest.runAllTimersAsync();
            expect(store.getState()).toStrictEqual({
                data: undefined,
                error,
                status: 'error',
            });
        });
        it('notifies subscribers when state changes', async () => {
            expect.assertions(2);
            const { promise, resolve } = Promise.withResolvers<number>();
            execute.mockReturnValueOnce(promise);
            const store = rpc.someMethod(123).reactiveStore();
            const subscriberA = jest.fn();
            const subscriberB = jest.fn();
            store.subscribe(subscriberA);
            store.subscribe(subscriberB);
            resolve(42);
            await jest.runAllTimersAsync();
            expect(subscriberA).toHaveBeenCalledTimes(1);
            expect(subscriberB).toHaveBeenCalledTimes(1);
        });
        it('re-fires the plan when dispatch() is called', async () => {
            expect.assertions(1);
            // request 1: rejects
            execute.mockRejectedValueOnce(new Error('o no'));
            const store = rpc.someMethod(123).reactiveStore();
            await jest.runAllTimersAsync();
            // request 2: resolves
            execute.mockResolvedValueOnce(42);
            store.dispatch();
            await jest.runAllTimersAsync();
            expect(execute).toHaveBeenCalledTimes(2);
        });
        it('aborts the in-flight signal and returns to idle when reset() is called', () => {
            const store = rpc.someMethod(123).reactiveStore();
            const { signal } = execute.mock.calls[0][0];
            expect(signal.aborted).toBe(false);
            store.reset();
            expect(signal.aborted).toBe(true);
            expect(store.getState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'idle',
            });
        });
    });
    describe('when calling a method having a concrete implementation', () => {
        let rpc: Rpc<TestRpcMethods>;
        beforeEach(() => {
            rpc = createRpc({
                api: {
                    someMethod(...params: unknown[]): RpcPlan<unknown> {
                        const payload = createRpcMessage({
                            methodName: 'someMethodAugmented',
                            params: [...params, 'augmented', 'params'],
                        });
                        return { execute: ({ signal, transport }) => transport({ payload, signal }) };
                    },
                } as RpcApi<TestRpcMethods>,
                transport: makeHttpRequest,
            });
        });
        it('converts the returned request to a JSON-RPC 2.0 message and sends it to the transport', () => {
            rpc.someMethod(123)
                .send()
                .catch(() => {});
            expect(makeHttpRequest).toHaveBeenCalledWith({
                payload: {
                    ...createRpcMessage({ methodName: 'someMethodAugmented', params: [123, 'augmented', 'params'] }),
                    id: expect.any(String),
                },
            });
        });
    });
});
