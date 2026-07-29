import type { ClientWithTransactionSending, InstructionPlanInput, TransactionPlanResult } from '@solana/kit';
import { act } from '@testing-library/react';

import { renderHook } from '../__test-utils__/render';
import { useSendTransactions } from '../useSendTransactions';

describe('useSendTransactions', () => {
    const input = {} as InstructionPlanInput;
    const sendResult = {} as TransactionPlanResult;

    it('calls client.sendTransactions with the input and an abort signal, then resolves', async () => {
        expect.assertions(5);
        const { promise, resolve } = Promise.withResolvers<TransactionPlanResult>();
        const sendTransactions = jest.fn(() => promise);
        const client = { sendTransactions } as unknown as ClientWithTransactionSending;
        const { result } = renderHook(() => useSendTransactions(client));

        expect(result.current.status).toBe('idle');

        act(() => {
            result.current.dispatch(input);
        });
        expect(result.current.status).toBe('running');
        expect(sendTransactions).toHaveBeenCalledWith(input, { abortSignal: expect.any(AbortSignal) });

        await act(async () => resolve(sendResult));
        expect(result.current.status).toBe('success');
        expect(result.current.data).toBe(sendResult);
    });

    it('surfaces a rejection as an error', async () => {
        expect.assertions(2);
        const boom = new Error('boom');
        const { promise, reject } = Promise.withResolvers<TransactionPlanResult>();
        const sendTransactions = jest.fn(() => promise);
        const client = { sendTransactions } as unknown as ClientWithTransactionSending;
        const { result } = renderHook(() => useSendTransactions(client));

        act(() => {
            result.current.dispatch(input);
        });
        await act(async () => reject(boom));
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(boom);
    });
});
