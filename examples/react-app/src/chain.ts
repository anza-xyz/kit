import type { SolanaChain } from '@solana/wallet-standard-chains';
import { useCallback, useState } from 'react';

/**
 * The chains this example lets you switch between. `solana:devnet` is the default. Mainnet is only
 * offered when `REACT_EXAMPLE_APP_MAINNET_URL` is set, because the public mainnet endpoint is rate
 * limited to the point of being unusable — you must point the app at your own RPC to enable it.
 */
export const SUPPORTED_CHAINS: readonly SolanaChain[] = process.env.REACT_EXAMPLE_APP_MAINNET_URL
    ? ['solana:devnet', 'solana:testnet', 'solana:mainnet']
    : ['solana:devnet', 'solana:testnet'];

/** The chain selected on first load, before the user picks another. */
export const DEFAULT_CHAIN: SolanaChain = 'solana:devnet';

/** Human-readable label for a chain, shown in the nav badge and wallet menus. */
export function getChainDisplayName(chain: SolanaChain): string {
    switch (chain) {
        case 'solana:mainnet':
            return 'Mainnet Beta';
        case 'solana:testnet':
            return 'Testnet';
        case 'solana:devnet':
        default:
            return 'Devnet';
    }
}

/** The `?cluster=` value Solana Explorer expects for a chain. */
export function getExplorerClusterName(chain: SolanaChain): 'devnet' | 'mainnet-beta' | 'testnet' {
    switch (chain) {
        case 'solana:mainnet':
            return 'mainnet-beta';
        case 'solana:testnet':
            return 'testnet';
        case 'solana:devnet':
        default:
            return 'devnet';
    }
}

const STORAGE_KEY = 'solana-example-react-app:selected-chain';

function isSupportedChain(value: string): value is SolanaChain {
    return (SUPPORTED_CHAINS as readonly string[]).includes(value);
}

/**
 * The selected chain, persisted to `localStorage` so it survives reloads. Returns the chain and a
 * setter that writes through to storage; an unrecognized stored value falls back to
 * {@link DEFAULT_CHAIN}.
 */
export function usePersistedChain(): readonly [SolanaChain, (chain: SolanaChain) => void] {
    const [chain, setChainState] = useState<SolanaChain>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored != null && isSupportedChain(stored)) {
            return stored;
        }
        if (stored != null) {
            localStorage.removeItem(STORAGE_KEY);
        }
        return DEFAULT_CHAIN;
    });
    const setChain = useCallback((nextChain: SolanaChain) => {
        localStorage.setItem(STORAGE_KEY, nextChain);
        setChainState(nextChain);
    }, []);
    return [chain, setChain];
}
