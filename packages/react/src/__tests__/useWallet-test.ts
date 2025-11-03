import type { Address } from '@solana/addresses';

import { renderHook } from '../test-renderer';
import { useClusterState } from '../hooks/useClusterState';
import { useClusterStatus } from '../hooks/useClusterStatus';
import { useWallet } from '../hooks/useWallet';
import { useWalletSession } from '../hooks/useWalletSession';
import { useSolanaState } from '../client/context';
import type { ClientState, WalletStatus } from '../client/types';

jest.mock('../client/context');

const mockUseSolanaState = jest.mocked(useSolanaState);

function createState(overrides: Partial<ClientState>): ClientState {
    return {
        accounts: {},
        cluster: {
            commitment: 'confirmed',
            endpoint: 'https://example.invalid',
            status: { status: 'idle' },
        },
        lastUpdatedAt: 0,
        subscriptions: {
            account: {},
            signature: {},
        },
        transactions: {},
        wallet: { status: 'disconnected' },
        ...overrides,
    };
}

describe('useWallet', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns the wallet slice from the Solana state', () => {
        const wallet: WalletStatus = { status: 'connecting', connectorId: 'alpha' };
        mockUseSolanaState.mockReturnValue(createState({ wallet }));
        const { result } = renderHook(() => useWallet());
        expect(result.__type).toBe('result');
        expect(result.current).toBe(wallet);
    });
});

describe('useWalletSession', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns the session when the wallet is connected', () => {
        const session = {
            account: {
                address: 'abc' as Address,
                publicKey: new Uint8Array([1, 2, 3]),
            },
            connector: {
                id: 'alpha',
                name: 'Alpha Wallet',
            },
            disconnect: jest.fn(),
        };
        mockUseSolanaState.mockReturnValue(
            createState({
                wallet: {
                    connectorId: 'alpha',
                    session,
                    status: 'connected',
                },
            }),
        );
        const { result } = renderHook(() => useWalletSession());
        expect(result.__type).toBe('result');
        expect(result.current).toBe(session);
    });

    it('returns undefined when no session is active', () => {
        mockUseSolanaState.mockReturnValue(createState({ wallet: { status: 'error', error: new Error('offline') } }));
        const { result } = renderHook(() => useWalletSession());
        expect(result.__type).toBe('result');
        expect(result.current).toBeUndefined();
    });
});

describe('useClusterState', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns the cluster state', () => {
        const cluster = {
            commitment: 'processed',
            endpoint: 'https://Solana.invalid',
            status: { status: 'ready', latencyMs: 12 },
            websocketEndpoint: 'wss://solana.invalid',
        } as ClientState['cluster'];
        mockUseSolanaState.mockReturnValue(createState({ cluster }));
        const { result } = renderHook(() => useClusterState());
        expect(result.__type).toBe('result');
        expect(result.current).toBe(cluster);
    });
});

describe('useClusterStatus', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns the current cluster status', () => {
        const cluster = {
            commitment: 'processed',
            endpoint: 'https://Solana.invalid',
            status: { status: 'error', error: new Error('nope') },
        } as ClientState['cluster'];
        mockUseSolanaState.mockReturnValue(createState({ cluster }));
        const { result } = renderHook(() => useClusterStatus());
        expect(result.__type).toBe('result');
        expect(result.current).toBe(cluster.status);
    });
});
