import type {
    ClientWithTransactionSending,
    InstructionPlanInput,
    SuccessfulSingleTransactionPlanResult,
} from '@solana/kit';
import { act } from '@testing-library/react';

import { renderHook } from '../__test-utils__/render';
import { useSendTransaction } from '../useSendTransaction';

describe('useSendTransaction', () => {
    const input = {} as InstructionPlanInput;
    const sendResult = {} as SuccessfulSingleTransactionPlanResult;

    it('calls client.sendTransaction with the input and an abort signal, then resolves', async () => {
        expect.assertions(5);
        const { promise, resolve } = Promise.withResolvers<SuccessfulSingleTransactionPlanResult>();
        const sendTransaction = jest.fn(() => promise);
        const client = { sendTransaction } as unknown as ClientWithTransactionSending;
        const { result } = renderHook(() => useSendTransaction(client));

        expect(result.current.status).toBe('idle');

        act(() => {
            result.current.dispatch(input);
        });
        expect(result.current.status).toBe('running');
        expect(sendTransaction).toHaveBeenCalledWith(input, { abortSignal: expect.any(AbortSignal) });

        await act(async () => resolve(sendResult));
        expect(result.current.status).toBe('success');
        expect(result.current.data).toBe(sendResult);
    });

    it('surfaces a rejection as an error', async () => {
        expect.assertions(2);
        const boom = new Error('boom');
        const { promise, reject } = Promise.withResolvers<SuccessfulSingleTransactionPlanResult>();
        const sendTransaction = jest.fn(() => promise);
        const client = { sendTransaction } as unknown as ClientWithTransactionSending;
        const { result } = renderHook(() => useSendTransaction(client));

        act(() => {
            result.current.dispatch(input);
        });
        await act(async () => reject(boom));
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(boom);
    });
});
