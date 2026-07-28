import { useConnectedWallet, useIsWalletReady } from '@solana/kit-plugin-wallet/react';

import { renderHook } from '../../__test-utils__/render';
import { useDisplayedWallet } from '../useDisplayedWallet';

jest.mock('@solana/react', () => ({ useClient: jest.fn(() => ({})) }));
jest.mock('@solana/kit-plugin-wallet/react', () => ({
    useConnectedWallet: jest.fn(),
    useIsWalletReady: jest.fn(),
}));

const mockUseConnectedWallet = useConnectedWallet as jest.Mock;
const mockUseIsWalletReady = useIsWalletReady as jest.Mock;

// Minimal shape — the hook only ever reads `.account.address` downstream.
function connection(address: string) {
    return { account: { address }, signer: {}, wallet: {} } as unknown as ReturnType<typeof useConnectedWallet>;
}

describe('useDisplayedWallet', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns the live connection with isStale=false when ready', () => {
        mockUseConnectedWallet.mockReturnValue(connection('AAAA'));
        mockUseIsWalletReady.mockReturnValue(true);
        const { result } = renderHook(() => useDisplayedWallet());
        expect(result.current.connected?.account.address).toBe('AAAA');
        expect(result.current.isStale).toBe(false);
    });

    it('holds the last settled connection with isStale=true while warming', () => {
        mockUseConnectedWallet.mockReturnValue(connection('AAAA'));
        mockUseIsWalletReady.mockReturnValue(true);
        const { result, rerender } = renderHook(() => useDisplayedWallet());
        // Chain switch: new client is warming — connected goes null, not ready.
        mockUseConnectedWallet.mockReturnValue(null);
        mockUseIsWalletReady.mockReturnValue(false);
        rerender();
        expect(result.current.connected?.account.address).toBe('AAAA'); // retained
        expect(result.current.isStale).toBe(true);
    });

    it('adopts the new connection once warm-up completes', () => {
        mockUseConnectedWallet.mockReturnValue(connection('AAAA'));
        mockUseIsWalletReady.mockReturnValue(true);
        const { result, rerender } = renderHook(() => useDisplayedWallet());
        mockUseConnectedWallet.mockReturnValue(null);
        mockUseIsWalletReady.mockReturnValue(false);
        rerender();
        mockUseConnectedWallet.mockReturnValue(connection('BBBB'));
        mockUseIsWalletReady.mockReturnValue(true);
        rerender();
        expect(result.current.connected?.account.address).toBe('BBBB');
        expect(result.current.isStale).toBe(false);
    });

    it('reflects a genuine disconnect once settled', () => {
        mockUseConnectedWallet.mockReturnValue(connection('AAAA'));
        mockUseIsWalletReady.mockReturnValue(true);
        const { result, rerender } = renderHook(() => useDisplayedWallet());
        mockUseConnectedWallet.mockReturnValue(null);
        mockUseIsWalletReady.mockReturnValue(true); // settled + disconnected
        rerender();
        expect(result.current.connected).toBeNull();
        expect(result.current.isStale).toBe(false);
    });
});
