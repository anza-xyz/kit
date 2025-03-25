import type { Slot } from '@solana/rpc-types';

type MinimumLedgerSlotApiResponse = Slot;

export type MinimumLedgerSlotApi = {
    /**
     * Returns the lowest slot about which the node has information.
     *
     * Different nodes may offer more or less historical slot data, depending on their
     * configuration. An appropriately configured node should be able to access all slots, from
     * genesis onward. When it is not, this method will tell you the lowest slot available.
     *
     * @see https://solana.com/docs/rpc/http/minimumledgerslot
     */
    minimumLedgerSlot(): MinimumLedgerSlotApiResponse;
};
