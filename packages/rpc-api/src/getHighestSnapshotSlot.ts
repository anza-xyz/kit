import type { Slot } from '@solana/rpc-types';

type GetHighestSnapshotSlotApiResponse = Readonly<{
    /** The highest full snapshot slot */
    full: Slot;
    /**
     * The highest incremental snapshot slot based on the slot indicated by
     * {@link GetHighestSnapshotSlotApiResponse.full | full}
     */
    incremental: Slot | null;
}>;

export type GetHighestSnapshotSlotApi = {
    /**
     * Returns the highest slot information that the node has snapshots for.
     *
     * This will find the highest full snapshot slot, and the highest incremental snapshot slot
     * based on the full snapshot slot, if there is one.
     *
     * @see https://solana.com/docs/rpc/http/gethighestsnapshotslot
     */
    getHighestSnapshotSlot(): GetHighestSnapshotSlotApiResponse;
};
