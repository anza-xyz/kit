import type { Slot, UnixTimestamp } from '@solana/rpc-types';

type GetBlockTimeApiResponse = UnixTimestamp;

export type GetBlockTimeApi = {
    /**
     * Returns the estimated production time of a block.
     *
     * Each validator reports their UTC time to the ledger on a regular interval by intermittently
     * adding a timestamp to a vote for a particular block. A requested block's time is calculated
     * from the stake-weighted mean of the vote timestamps in a set of recent blocks recorded on the
     * ledger.
     *
     * @returns Estimated production time, as Unix timestamp (seconds since the Unix epoch)
     * @see https://solana.com/docs/rpc/http/getblocktime
     */
    getBlockTime(
        /** Block number, identified by slot */
        blockNumber: Slot,
    ): GetBlockTimeApiResponse;
};
