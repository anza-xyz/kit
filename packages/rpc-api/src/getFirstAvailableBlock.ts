import type { Slot } from '@solana/rpc-types';

type GetFirstAvailableBlockApiResponse = Slot;

export type GetFirstAvailableBlockApi = {
    /**
     * Returns the slot of the lowest confirmed block available on the node.
     *
     * Different nodes may offer more or less historical block data, depending on their
     * configuration. An appropriately configured node should be able to access all blocks, from
     * genesis onward. When it is not, this method will tell you the slot of the lowest block
     * available.
     *
     * @see https://solana.com/docs/rpc/http/getfirstavailableblock
     */
    getFirstAvailableBlock(): GetFirstAvailableBlockApiResponse;
};
