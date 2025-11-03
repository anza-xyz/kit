import type { Address } from '@solana/addresses';
import type { Lamports } from '@solana/rpc-types';

import { renderHook } from '../test-renderer';
import { useAccount } from '../hooks/useAccount';
import { useBalance } from '../hooks/useBalance';
import { useAccountActions } from '../client/actions';
import { useSolanaActions, useSolanaState } from '../client/context';
import { createWatchers } from '../client/watchers';
import type { AccountCacheEntry, ClientState, SolanaClientConfig } from '../client/types';

jest.mock('../client/actions');
jest.mock('../client/context');
jest.mock('../client/watchers');

const mockUseAccountActions = jest.mocked(useAccountActions);
const mockUseSolanaActions = jest.mocked(useSolanaActions);
const mockUseSolanaState = jest.mocked(useSolanaState);
const mockCreateWatchers = jest.mocked(createWatchers);

const config: SolanaClientConfig = {
    endpoint: 'https://example.invalid',
};

const accountAddress = '11111111111111111111111111111111' as Address;
const accountKey = accountAddress.toString();

const cachedAccount: AccountCacheEntry = {
    address: accountAddress,
    data: { owner: 'example' },
    error: undefined,
    fetching: false,
    lamports: 1_000_000n as unknown as Lamports,
    lastFetchedAt: 123,
    slot: 456n,
};

function createState(overrides: Partial<ClientState> = {}): ClientState {
    return {
        accounts: { [accountKey]: cachedAccount },
        cluster: {
            commitment: 'confirmed',
            endpoint: 'https://cluster.invalid',
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

describe('useAccount', () => {
    let fetchAccount: jest.Mock<Promise<AccountCacheEntry>, [Address, (string | undefined)?]>;
    let fetchBalance: jest.Mock<Promise<Lamports>, [Address, (string | undefined)?]>;
    let watchAccount: jest.Mock;
    let watchBalance: jest.Mock;
    let state: ClientState;

    beforeEach(() => {
        fetchAccount = jest.fn().mockResolvedValue(cachedAccount);
        fetchBalance = jest.fn().mockResolvedValue(cachedAccount.lamports as Lamports);
        watchAccount = jest.fn().mockReturnValue({ abort: jest.fn() });
        watchBalance = jest.fn().mockReturnValue({ abort: jest.fn() });
        mockUseAccountActions.mockReturnValue({
            fetchAccount,
            fetchBalance,
        });
        mockCreateWatchers.mockReturnValue({
            watchAccount,
            watchBalance,
        });
        mockUseSolanaActions.mockImplementation(() => ({
            dispatch: jest.fn(),
            getState: () => state,
            logger: jest.fn(),
            runtime: {
                rpc: {},
                rpcSubscriptions: {},
            },
        }));
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns undefined and performs no work when no address is supplied', async () => {
        state = createState();
        mockUseSolanaState.mockImplementation(() => state);
        const { result } = renderHook(() => useAccount(config));
        await Promise.resolve();
        expect(result.__type).toBe('result');
        expect(result.current).toBeUndefined();
        expect(fetchAccount).not.toHaveBeenCalled();
        expect(watchAccount).not.toHaveBeenCalled();
    });

    it('fetches the account when an address is provided', async () => {
        state = createState({
            accounts: { [accountKey]: cachedAccount },
        });
        mockUseSolanaState.mockImplementation(() => state);
        const { result } = renderHook(() => useAccount(config, accountAddress));
        await Promise.resolve();
        expect(fetchAccount).toHaveBeenCalledWith(accountAddress, undefined);
        expect(result.__type).toBe('result');
        expect(result.current).toBe(cachedAccount);
    });

    it('respects commitment overrides and enables watching when requested', async () => {
        state = createState();
        mockUseSolanaState.mockImplementation(() => state);
        const { result } = renderHook(() =>
            useAccount(config, accountAddress, { commitment: 'processed', watch: true }),
        );
        await Promise.resolve();
        expect(fetchAccount).toHaveBeenCalledWith(accountAddress, 'processed');
        expect(watchAccount).toHaveBeenCalledWith(
            { address: accountAddress, commitment: 'processed' },
            expect.any(Function),
        );
        expect(result.__type).toBe('result');
        expect(result.current).toBe(cachedAccount);
    });

    it('skips fetching when instructed', async () => {
        state = createState();
        mockUseSolanaState.mockImplementation(() => state);
        const { result } = renderHook(() =>
            useAccount(config, accountAddress, { fetch: false, watch: true }),
        );
        await Promise.resolve();
        expect(fetchAccount).not.toHaveBeenCalled();
        expect(watchAccount).toHaveBeenCalledTimes(1);
        expect(result.__type).toBe('result');
        expect(result.current).toBe(cachedAccount);
    });

    it('ignores work entirely when skip is true', async () => {
        state = createState();
        mockUseSolanaState.mockImplementation(() => state);
        const { result } = renderHook(() =>
            useAccount(config, accountAddress, { skip: true, watch: true }),
        );
        await Promise.resolve();
        expect(fetchAccount).not.toHaveBeenCalled();
        expect(watchAccount).not.toHaveBeenCalled();
        expect(result.__type).toBe('result');
        expect(result.current).toBeUndefined();
    });
});

describe('useBalance', () => {
    let fetchAccount: jest.Mock<Promise<AccountCacheEntry>, [Address, (string | undefined)?]>;
    let fetchBalance: jest.Mock<Promise<Lamports>, [Address, (string | undefined)?]>;
    let watchAccount: jest.Mock;
    let watchBalance: jest.Mock;
    let state: ClientState;

    beforeEach(() => {
        fetchAccount = jest.fn().mockResolvedValue(cachedAccount);
        fetchBalance = jest.fn().mockResolvedValue(cachedAccount.lamports as Lamports);
        watchAccount = jest.fn().mockReturnValue({ abort: jest.fn() });
        watchBalance = jest.fn().mockReturnValue({ abort: jest.fn() });
        mockUseAccountActions.mockReturnValue({
            fetchAccount,
            fetchBalance,
        });
        mockCreateWatchers.mockReturnValue({
            watchAccount,
            watchBalance,
        });
        mockUseSolanaActions.mockImplementation(() => ({
            dispatch: jest.fn(),
            getState: () => state,
            logger: jest.fn(),
            runtime: {
                rpc: {},
                rpcSubscriptions: {},
            },
        }));
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns default values when skipped', async () => {
        state = createState({ accounts: {} });
        mockUseSolanaState.mockImplementation(() => state);
        const { result } = renderHook(() => useBalance(config));
        await Promise.resolve();
        expect(result.__type).toBe('result');
        expect(result.current).toEqual({
            account: undefined,
            error: undefined,
            fetching: false,
            lamports: null,
            slot: undefined,
        });
        expect(fetchBalance).not.toHaveBeenCalled();
        expect(watchBalance).not.toHaveBeenCalled();
    });

    it('fetches and watches balance information by default', async () => {
        state = createState();
        mockUseSolanaState.mockImplementation(() => state);
        const { result } = renderHook(() => useBalance(config, accountAddress));
        await Promise.resolve();
        expect(fetchBalance).toHaveBeenCalledWith(accountAddress, undefined);
        expect(watchBalance).toHaveBeenCalledWith(
            { address: accountAddress, commitment: undefined },
            expect.any(Function),
        );
        expect(result.__type).toBe('result');
        expect(result.current).toEqual({
            account: cachedAccount,
            error: undefined,
            fetching: false,
            lamports: cachedAccount.lamports,
            slot: cachedAccount.slot,
        });
    });

    it('honours fetch and watch overrides', async () => {
        state = createState();
        mockUseSolanaState.mockImplementation(() => state);
        const { result } = renderHook(() =>
            useBalance(config, accountAddress, { commitment: 'finalized', fetch: false, watch: false }),
        );
        await Promise.resolve();
        expect(fetchBalance).not.toHaveBeenCalled();
        expect(watchBalance).not.toHaveBeenCalled();
        expect(result.__type).toBe('result');
        expect(result.current?.lamports).toBe(cachedAccount.lamports);
    });
});
