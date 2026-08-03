import type { Address, ClientWithAirdrop, Lamports, Signature } from '@solana/kit';
import { act } from '@testing-library/react';

import { renderHook } from '../__test-utils__/render';
import { useAirdrop } from '../useAirdrop';

describe('useAirdrop', () => {
    const address = 'AACC' as Address;
    const amount = 1_000_000_000n as Lamports;
    const signature = 'sig' as Signature;

    it('calls client.airdrop with the address, amount, and an abort signal, then resolves', async () => {
        expect.assertions(5);
        const { promise, resolve } = Promise.withResolvers<Signature | undefined>();
        const airdrop = jest.fn(() => promise);
        const client = { airdrop } as unknown as ClientWithAirdrop;
        const { result } = renderHook(() => useAirdrop(client));

        expect(result.current.status).toBe('idle');

        act(() => {
            result.current.dispatch(address, amount);
        });
        expect(result.current.status).toBe('running');
        expect(airdrop).toHaveBeenCalledWith(address, amount, expect.any(AbortSignal));

        await act(async () => resolve(signature));
        expect(result.current.status).toBe('success');
        expect(result.current.data).toBe(signature);
    });

    it('resolves with `undefined` when the airdrop was performed without a transaction', async () => {
        expect.assertions(2);
        const { promise, resolve } = Promise.withResolvers<Signature | undefined>();
        const airdrop = jest.fn(() => promise);
        const client = { airdrop } as unknown as ClientWithAirdrop;
        const { result } = renderHook(() => useAirdrop(client));

        act(() => {
            result.current.dispatch(address, amount);
        });
        await act(async () => resolve(undefined));
        expect(result.current.status).toBe('success');
        expect(result.current.data).toBeUndefined();
    });

    it('surfaces a rejection as an error', async () => {
        expect.assertions(2);
        const boom = new Error('boom');
        const { promise, reject } = Promise.withResolvers<Signature | undefined>();
        const airdrop = jest.fn(() => promise);
        const client = { airdrop } as unknown as ClientWithAirdrop;
        const { result } = renderHook(() => useAirdrop(client));

        act(() => {
            result.current.dispatch(address, amount);
        });
        await act(async () => reject(boom));
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(boom);
    });
});
