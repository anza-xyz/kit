import type { ClientWithIdentity, ClientWithSubscribeToIdentity, TransactionSigner } from '@solana/kit';
import { act } from '@testing-library/react';

import { renderHook } from '../__test-utils__/render';
import { useIdentity } from '../useIdentity';

describe('useIdentity', () => {
    const signerA = { address: 'A' } as unknown as TransactionSigner;
    const signerB = { address: 'B' } as unknown as TransactionSigner;

    it('returns the current identity', () => {
        const client = { identity: signerA } as ClientWithIdentity;
        const { result } = renderHook(() => useIdentity(client));
        expect(result.current).toBe(signerA);
    });

    it('subscribes and re-renders with the latest identity when the client is reactive', () => {
        let listener: (() => void) | undefined;
        const client = {
            identity: signerA,
            subscribeToIdentity: jest.fn(l => {
                listener = l;
                return () => {};
            }),
        } as ClientWithIdentity & ClientWithSubscribeToIdentity;
        const { result } = renderHook(() => useIdentity(client));

        expect(result.current).toBe(signerA);
        expect(client.subscribeToIdentity).toHaveBeenCalled();

        act(() => {
            client.identity = signerB;
            listener!();
        });
        expect(result.current).toBe(signerB);
    });

    it('unsubscribes on unmount', () => {
        const unsubscribe = jest.fn();
        const client = {
            identity: signerA,
            subscribeToIdentity: jest.fn(() => unsubscribe),
        } as ClientWithIdentity & ClientWithSubscribeToIdentity;
        const { unmount } = renderHook(() => useIdentity(client));

        unmount();
        expect(unsubscribe).toHaveBeenCalled();
    });

    it('returns undefined while the identity getter throws, then recovers when it becomes available', () => {
        let connected = false;
        let listener: (() => void) | undefined;
        const client = {
            get identity() {
                if (!connected) {
                    throw new Error('No signing wallet connected');
                }
                return signerA;
            },
            subscribeToIdentity: jest.fn(l => {
                listener = l;
                return () => {};
            }),
        } as ClientWithIdentity & ClientWithSubscribeToIdentity;
        const { result } = renderHook(() => useIdentity(client));

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
        const client = { identity: signerA } as ClientWithIdentity;
        const { result, rerender } = renderHook(() => useIdentity(client));
        expect(result.current).toBe(signerA);

        // Without a `subscribeToIdentity` function there is nothing to trigger a re-render on its
        // own, so a bare mutation is not observed...
        client.identity = signerB;
        expect(result.current).toBe(signerA);

        // ...but the current value is read again on the next render.
        rerender();
        expect(result.current).toBe(signerB);
    });
});
