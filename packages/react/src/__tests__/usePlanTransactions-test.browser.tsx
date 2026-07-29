import type { ClientWithTransactionPlanning, InstructionPlanInput, TransactionPlan } from '@solana/kit';
import { act } from '@testing-library/react';

import { renderHook } from '../__test-utils__/render';
import { usePlanTransactions } from '../usePlanTransactions';

describe('usePlanTransactions', () => {
    const input = {} as InstructionPlanInput;
    const plan = {} as TransactionPlan;

    it('calls client.planTransactions with the input and an abort signal, then resolves', async () => {
        expect.assertions(5);
        const { promise, resolve } = Promise.withResolvers<TransactionPlan>();
        const planTransactions = jest.fn(() => promise);
        const client = { planTransactions } as unknown as ClientWithTransactionPlanning;
        const { result } = renderHook(() => usePlanTransactions(client));

        expect(result.current.status).toBe('idle');

        act(() => {
            result.current.dispatch(input);
        });
        expect(result.current.status).toBe('running');
        expect(planTransactions).toHaveBeenCalledWith(input, { abortSignal: expect.any(AbortSignal) });

        await act(async () => resolve(plan));
        expect(result.current.status).toBe('success');
        expect(result.current.data).toBe(plan);
    });

    it('surfaces a rejection as an error', async () => {
        expect.assertions(2);
        const boom = new Error('boom');
        const { promise, reject } = Promise.withResolvers<TransactionPlan>();
        const planTransactions = jest.fn(() => promise);
        const client = { planTransactions } as unknown as ClientWithTransactionPlanning;
        const { result } = renderHook(() => usePlanTransactions(client));

        act(() => {
            result.current.dispatch(input);
        });
        await act(async () => reject(boom));
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(boom);
    });
});
