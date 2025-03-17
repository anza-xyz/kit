import type { Slot } from '@solana/rpc-types';

type GetFirstAvailableBlockApiResponse = Slot;

export type GetFirstAvailableBlockApi = {
    /**
     * Returns the slot of the lowest confirmed block that has not been purged from the ledger
     */
    getFirstAvailableBlock(): GetFirstAvailableBlockApiResponse;
};
