import { act } from 'react-test-renderer';

import { renderHook } from '../test-renderer';
import { useWalletStandardConnectors } from '../hooks/useWalletStandardConnectors';
import type { WalletConnector } from '../client/types';
import { getWalletStandardConnectors, watchWalletStandardConnectors } from '../wallet/standard';

jest.mock('../wallet/standard');

const mockGetWalletStandardConnectors = jest.mocked(getWalletStandardConnectors);
const mockWatchWalletStandardConnectors = jest.mocked(watchWalletStandardConnectors);

describe('useWalletStandardConnectors', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('loads and watches Wallet Standard connectors', async () => {
        const initial: readonly WalletConnector[] = [
            {
                canAutoConnect: true,
                connect: jest.fn(),
                disconnect: jest.fn(),
                id: 'alpha',
                isSupported: () => true,
                name: 'Alpha',
            },
        ];
        const updated: readonly WalletConnector[] = [
            ...initial,
            {
                canAutoConnect: false,
                connect: jest.fn(),
                disconnect: jest.fn(),
                id: 'beta',
                isSupported: () => true,
                name: 'Beta',
            },
        ];

        let listener: ((next: readonly WalletConnector[]) => void) | undefined;
        const teardown = jest.fn();
        mockGetWalletStandardConnectors.mockReturnValueOnce(initial).mockReturnValueOnce(initial);
        mockWatchWalletStandardConnectors.mockImplementation((onChange) => {
            listener = onChange;
            return teardown;
        });

        const overrides = jest.fn();
        const { result } = renderHook(() => useWalletStandardConnectors({ overrides }));
        expect(result.__type).toBe('result');
        expect(mockGetWalletStandardConnectors).toHaveBeenNthCalledWith(1, { overrides });
        expect(mockGetWalletStandardConnectors).toHaveBeenNthCalledWith(2, { overrides });
        expect(mockWatchWalletStandardConnectors).toHaveBeenCalledTimes(1);
        const [onChange, options] = mockWatchWalletStandardConnectors.mock.calls[0];
        expect(options).toEqual({ overrides });
        expect(result.current).toEqual(initial);

        await act(async () => {
            onChange(updated);
        });

        expect(result.current).toEqual(updated);
        expect(listener).toBe(onChange);

        await act(async () => {
            if (!listener) {
                throw new Error('listener not registered');
            }
            listener(initial);
        });
        expect(result.current).toEqual(initial);

        expect(teardown).not.toHaveBeenCalled();
    });
});
