import type { ClientWithPayer, ClientWithSubscribeToPayer, TransactionSigner } from '@solana/kit';
import { act } from '@testing-library/react';

import { renderHook } from '../__test-utils__/render';
import { usePayer } from '../usePayer';

describe('usePayer', () => {
    const signerA = { address: 'A' } as unknown as TransactionSigner;
    const signerB = { address: 'B' } as unknown as TransactionSigner;

    it('returns the current payer', () => {
        const client = { payer: signerA } as ClientWithPayer;
        const { result } = renderHook(() => usePayer(client));
        expect(result.current).toBe(signerA);
    });

    it('subscribes and re-renders with the latest payer when the client is reactive', () => {
        let listener: (() => void) | undefined;
        const client = {
            payer: signerA,
            subscribeToPayer: jest.fn(l => {
                listener = l;
                return () => {};
            }),
        } as ClientWithPayer & ClientWithSubscribeToPayer;
        const { result } = renderHook(() => usePayer(client));

        expect(result.current).toBe(signerA);
        expect(client.subscribeToPayer).toHaveBeenCalled();

        act(() => {
            client.payer = signerB;
            listener!();
        });
        expect(result.current).toBe(signerB);
    });

    it('unsubscribes on unmount', () => {
        const unsubscribe = jest.fn();
        const client = {
            payer: signerA,
            subscribeToPayer: jest.fn(() => unsubscribe),
        } as ClientWithPayer & ClientWithSubscribeToPayer;
        const { unmount } = renderHook(() => usePayer(client));

        unmount();
        expect(unsubscribe).toHaveBeenCalled();
    });

    it('returns undefined while the payer getter throws, then recovers when it becomes available', () => {
        let connected = false;
        let listener: (() => void) | undefined;
        const client = {
            get payer() {
                if (!connected) {
                    throw new Error('No signing wallet connected');
                }
                return signerA;
            },
            subscribeToPayer: jest.fn(l => {
                listener = l;
                return () => {};
            }),
        } as ClientWithPayer & ClientWithSubscribeToPayer;
        const { result } = renderHook(() => usePayer(client));

        expect(result.current).toBeUndefined();

        act(() => {
            connected = true;
            listener!();
        });
        expect(result.current).toBe(signerA);

        act(() => {
            connected = false;
            listener!();
        });
        expect(result.current).toBeUndefined();
    });

    it('has no subscription to react to changes when the client is not reactive, but reads the latest value on the next render', () => {
        const client = { payer: signerA } as ClientWithPayer;
        const { result, rerender } = renderHook(() => usePayer(client));
        expect(result.current).toBe(signerA);

        // Without a `subscribeToPayer` function there is nothing to trigger a re-render on its
        // own, so a bare mutation is not observed...
        client.payer = signerB;
        expect(result.current).toBe(signerA);

        // ...but the current value is read again on the next render.
        rerender();
        expect(result.current).toBe(signerB);
    });
});
