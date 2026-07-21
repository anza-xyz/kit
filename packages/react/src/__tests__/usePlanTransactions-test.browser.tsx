import type { ClientWithTransactionPlanning } from '@solana/kit';
import { createClient, isSolanaError, SOLANA_ERROR__REACT__MISSING_CAPABILITY } from '@solana/kit';
import { act } from '@testing-library/react';
import React from 'react';

import { renderHook } from '../__test-utils__/render';
import { ClientProvider } from '../ClientProvider';
import { usePlanTransactions } from '../usePlanTransactions';

type Input = Parameters<ClientWithTransactionPlanning['planTransactions']>[0];
type Result = Awaited<ReturnType<ClientWithTransactionPlanning['planTransactions']>>;

const INPUT = 'test-input' as unknown as Input;
const RESULT = 'test-result' as unknown as Result;

function wrapperFor<T extends object>(client: ReturnType<typeof createClient<T>>) {
    return ({ children }: { children: React.ReactNode }) => <ClientProvider client={client}>{children}</ClientProvider>;
}

describe('usePlanTransactions', () => {
    it('forwards the input and an abort signal to `planTransactions` and exposes the result as `data`', async () => {
        expect.assertions(4);
        const { promise, resolve } = Promise.withResolvers<Result>();
        const planTransactions = jest.fn(() => promise);
        const client = createClient<ClientWithTransactionPlanning>({
            planTransaction: jest.fn().mockRejectedValue(new Error('not implemented')),
            planTransactions,
        });
        const { result } = renderHook(() => usePlanTransactions(), { wrapper: wrapperFor(client) });

        act(() => {
            result.current.dispatch(INPUT);
        });
        expect(result.current.isRunning).toBe(true);
        expect(planTransactions).toHaveBeenCalledWith(INPUT, { abortSignal: expect.any(AbortSignal) });

        await act(async () => resolve(RESULT));
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toBe(RESULT);
    });

    it("aborts the in-flight call's signal when dispatched again", () => {
        let firstSignal: AbortSignal | undefined;
        const planTransactions = jest.fn((_input: Input, config?: { abortSignal?: AbortSignal }) => {
            firstSignal ??= config?.abortSignal;
            return new Promise<Result>(() => {}); // never settles
        });
        const client = createClient<ClientWithTransactionPlanning>({
            planTransaction: jest.fn().mockRejectedValue(new Error('not implemented')),
            planTransactions,
        });
        const { result } = renderHook(() => usePlanTransactions(), { wrapper: wrapperFor(client) });

        act(() => {
            result.current.dispatch(INPUT);
        });
        expect(firstSignal?.aborted).toBe(false);

        act(() => {
            result.current.dispatch(INPUT);
        });
        expect(firstSignal?.aborted).toBe(true);
    });

    it('throws MISSING_CAPABILITY when `planTransactions` is absent', () => {
        const client = createClient(); // no `planTransactions` capability
        const { result } = renderHook(
            () => {
                try {
                    return usePlanTransactions();
                } catch (err) {
                    return err;
                }
            },
            { wrapper: wrapperFor(client) },
        );
        expect(isSolanaError(result.current, SOLANA_ERROR__REACT__MISSING_CAPABILITY)).toBe(true);
        expect((result.current as { context: { capabilities: readonly string[] } }).context.capabilities).toEqual([
            'planTransactions',
        ]);
    });
});
