import type { ClusterUrl } from '@solana/kit';
import { devnet } from '@solana/kit';
import type { SolanaChain } from '@solana/wallet-standard-chains';
import { createContext } from 'react';

export type ChainContext = Readonly<{
    chain: SolanaChain;
    displayName: string;
    setChain?(chain: SolanaChain): void;
    solanaExplorerClusterName: 'devnet' | 'mainnet-beta' | 'testnet';
    solanaRpcSubscriptionsUrl: ClusterUrl;
    solanaRpcUrl: ClusterUrl;
}>;

export const DEFAULT_CHAIN_CONFIG = Object.freeze({
    chain: 'solana:devnet',
    displayName: 'Devnet',
    solanaExplorerClusterName: 'devnet',
    solanaRpcSubscriptionsUrl: devnet('wss://api.devnet.solana.com'),
    solanaRpcUrl: devnet('https://api.devnet.solana.com'),
});

export const ChainContext = createContext<ChainContext>(DEFAULT_CHAIN_CONFIG);
