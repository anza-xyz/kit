import type { ClientWithTransactionSending } from '@solana/kit';
import { createClient, isSolanaError, SOLANA_ERROR__REACT__MISSING_CAPABILITY } from '@solana/kit';
import { act } from '@testing-library/react';
import React from 'react';

import { renderHook } from '../__test-utils__/render';
import { ClientProvider } from '../ClientProvider';
import { useSendTransactions } from '../useSendTransactions';

type Input = Parameters<ClientWithTransactionSending['sendTransactions']>[0];
type Result = Awaited<ReturnType<ClientWithTransactionSending['sendTransactions']>>;

const INPUT = 'test-input' as unknown as Input;
const RESULT = 'test-result' as unknown as Result;

function wrapperFor<T extends object>(client: ReturnType<typeof createClient<T>>) {
    return ({ children }: { children: React.ReactNode }) => <ClientProvider client={client}>{children}</ClientProvider>;
}

describe('useSendTransactions', () => {
    it('forwards the input and an abort signal to `sendTransactions` and exposes the result as `data`', async () => {
        expect.assertions(4);
        const { promise, resolve } = Promise.withResolvers<Result>();
        const sendTransactions = jest.fn(() => promise);
        const client = createClient<ClientWithTransactionSending>({
            sendTransaction: jest.fn().mockRejectedValue(new Error('not implemented')),
            sendTransactions,
        });
        const { result } = renderHook(() => useSendTransactions(), { wrapper: wrapperFor(client) });

        act(() => {
            result.current.dispatch(INPUT);
        });
        expect(result.current.isRunning).toBe(true);
        expect(sendTransactions).toHaveBeenCalledWith(INPUT, { abortSignal: expect.any(AbortSignal) });

        await act(async () => resolve(RESULT));
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toBe(RESULT);
    });

    it("aborts the in-flight call's signal when dispatched again", () => {
        let firstSignal: AbortSignal | undefined;
        const sendTransactions = jest.fn((_input: Input, config?: { abortSignal?: AbortSignal }) => {
            firstSignal ??= config?.abortSignal;
            return new Promise<Result>(() => {}); // never settles
        });
        const client = createClient<ClientWithTransactionSending>({
            sendTransaction: jest.fn().mockRejectedValue(new Error('not implemented')),
            sendTransactions,
        });
        const { result } = renderHook(() => useSendTransactions(), { wrapper: wrapperFor(client) });

        act(() => {
            result.current.dispatch(INPUT);
        });
        expect(firstSignal?.aborted).toBe(false);

        act(() => {
            result.current.dispatch(INPUT);
        });
        expect(firstSignal?.aborted).toBe(true);
    });

    it('throws MISSING_CAPABILITY when `sendTransactions` is absent', () => {
        const client = createClient(); // no `sendTransactions` capability
        const { result } = renderHook(
            () => {
                try {
                    return useSendTransactions();
                } catch (err) {
                    return err;
                }
            },
            { wrapper: wrapperFor(client) },
        );
        expect(isSolanaError(result.current, SOLANA_ERROR__REACT__MISSING_CAPABILITY)).toBe(true);
        expect((result.current as { context: { capabilities: readonly string[] } }).context.capabilities).toEqual([
            'sendTransactions',
        ]);
    });
});
