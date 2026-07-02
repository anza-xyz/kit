import type { Slot } from '@solana/rpc-types';

type GetAlpenglowMigrationSlotApiResponse = Slot | null;

export type GetAlpenglowMigrationSlotApi = {
    /**
     * Returns the slot in which the cluster will migrate to Alpenglow.
     *
     * @see https://solana.com/docs/rpc/http/getalpenglowmigrationslot
     */
    getAlpenglowMigrationSlot(config?: Readonly<object>): GetAlpenglowMigrationSlotApiResponse;
};
