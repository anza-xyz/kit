import { useIsWalletReady } from '@solana/kit-plugin-wallet/react';

import { renderHook } from '../../__test-utils__/render';
import { useHasWalletSettled } from '../useHasWalletSettled';

jest.mock('@solana/react', () => ({ useClient: jest.fn(() => ({})) }));
jest.mock('@solana/kit-plugin-wallet/react', () => ({ useIsWalletReady: jest.fn() }));

const mockUseIsWalletReady = useIsWalletReady as jest.Mock;

describe('useHasWalletSettled', () => {
    beforeEach(() => jest.clearAllMocks());

    it('is false before the first ready', () => {
        mockUseIsWalletReady.mockReturnValue(false);
        const { result } = renderHook(() => useHasWalletSettled());
        expect(result.current).toBe(false);
    });

    it('latches true on the first ready and never returns to false', () => {
        mockUseIsWalletReady.mockReturnValue(false);
        const { result, rerender } = renderHook(() => useHasWalletSettled());
        mockUseIsWalletReady.mockReturnValue(true);
        rerender();
        expect(result.current).toBe(true);
        mockUseIsWalletReady.mockReturnValue(false); // a later chain-switch warm-up
        rerender();
        expect(result.current).toBe(true);
    });
});
