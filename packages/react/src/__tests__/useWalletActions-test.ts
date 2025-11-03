import { renderHook } from '../test-renderer';
import { useConnectWallet } from '../hooks/useConnectWallet';
import { useDisconnectWallet } from '../hooks/useDisconnectWallet';
import { useWalletActions } from '../client/actions';
import type { SolanaClientConfig } from '../client/types';

jest.mock('../client/actions');

const mockUseWalletActions = jest.mocked(useWalletActions);

const config: SolanaClientConfig = {
    endpoint: 'https://example.invalid',
};

describe('useConnectWallet', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns a stable callback that delegates to the wallet actions helper', async () => {
        const connectWallet = jest.fn().mockResolvedValue(undefined);
        mockUseWalletActions.mockReturnValue({
            connectWallet,
            disconnectWallet: jest.fn(),
        });

        const { result, rerenderHook } = renderHook(() => useConnectWallet(config));
        expect(result.__type).toBe('result');
        if (result.__type !== 'result' || !result.current) {
            throw new Error('expected hook result');
        }
        expect(mockUseWalletActions).toHaveBeenCalledWith(config);
        const callback = result.current;
        await callback('alpha');
        expect(connectWallet).toHaveBeenCalledTimes(1);
        expect(connectWallet).toHaveBeenCalledWith('alpha');

        rerenderHook(() => useConnectWallet(config));
        expect(result.current).toBe(callback);
    });
});

describe('useDisconnectWallet', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns a stable callback that calls disconnectWallet', async () => {
        const disconnectWallet = jest.fn().mockResolvedValue(undefined);
        mockUseWalletActions.mockReturnValue({
            connectWallet: jest.fn(),
            disconnectWallet,
        });

        const { result, rerenderHook } = renderHook(() => useDisconnectWallet(config));
        expect(result.__type).toBe('result');
        if (result.__type !== 'result' || !result.current) {
            throw new Error('expected hook result');
        }

        const callback = result.current;
        await callback();
        expect(disconnectWallet).toHaveBeenCalledTimes(1);

        rerenderHook(() => useDisconnectWallet(config));
        expect(result.current).toBe(callback);
    });
});
