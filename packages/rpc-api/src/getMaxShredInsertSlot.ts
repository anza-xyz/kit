import type { Slot } from '@solana/rpc-types';

type GetMaxShredInsertSlotApiResponse = Slot;

export type GetMaxShredInsertSlotApi = {
    /**
     * Get the max slot seen from after shred insert.
     *
     * @see https://solana.com/docs/rpc/http/getmaxshredinsertslot
     */
    getMaxShredInsertSlot(): GetMaxShredInsertSlotApiResponse;
};
