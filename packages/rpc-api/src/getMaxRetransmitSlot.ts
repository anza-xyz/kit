import type { Slot } from '@solana/rpc-types';

type GetMaxRetransmitSlotApiResponse = Slot;

export type GetMaxRetransmitSlotApi = {
    /**
     * Get the max slot seen from retransmit stage.
     */
    getMaxRetransmitSlot(): GetMaxRetransmitSlotApiResponse;
};
