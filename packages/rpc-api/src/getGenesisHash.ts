import type { Blockhash } from '@solana/rpc-types';

type GetGenesisHashApiResponse = Blockhash;

export type GetGenesisHashApi = {
    /**
     * Returns the genesis hash
     */
    getGenesisHash(): GetGenesisHashApiResponse;
};
