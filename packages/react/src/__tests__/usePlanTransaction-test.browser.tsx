import type { ClientWithTransactionPlanning, InstructionPlanInput, SingleTransactionPlan } from '@solana/kit';
import { act } from '@testing-library/react';

import { renderHook } from '../__test-utils__/render';
import { usePlanTransaction } from '../usePlanTransaction';

describe('usePlanTransaction', () => {
    const input = {} as InstructionPlanInput;
    const message = {} as SingleTransactionPlan['message'];

    it('calls client.planTransaction with the input and an abort signal, then resolves', async () => {
        expect.assertions(5);
        const { promise, resolve } = Promise.withResolvers<SingleTransactionPlan['message']>();
        const planTransaction = jest.fn(() => promise);
        const client = { planTransaction } as unknown as ClientWithTransactionPlanning;
        const { result } = renderHook(() => usePlanTransaction(client));

        expect(result.current.status).toBe('idle');

        act(() => {
            result.current.dispatch(input);
        });
        expect(result.current.status).toBe('running');
        expect(planTransaction).toHaveBeenCalledWith(input, { abortSignal: expect.any(AbortSignal) });

        await act(async () => resolve(message));
        expect(result.current.status).toBe('success');
        expect(result.current.data).toBe(message);
    });

    it('surfaces a rejection as an error', async () => {
        expect.assertions(2);
        const boom = new Error('boom');
        const { promise, reject } = Promise.withResolvers<SingleTransactionPlan['message']>();
        const planTransaction = jest.fn(() => promise);
        const client = { planTransaction } as unknown as ClientWithTransactionPlanning;
        const { result } = renderHook(() => usePlanTransaction(client));

        act(() => {
            result.current.dispatch(input);
        });
        await act(async () => reject(boom));
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(boom);
    });
});
