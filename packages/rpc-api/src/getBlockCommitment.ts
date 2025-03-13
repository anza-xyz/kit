import type { Lamports, Slot } from '@solana/rpc-types';

type GetBlockCommitmentApiResponse = Readonly<{
    /**
     * An array that represents the amount of cluster stake, denominated in {@link Lamports}, that
     * has voted on the block at each depth from `0` to `MAX_LOCKOUT_HISTORY`.
     */
    commitment: Lamports[] | null;
    /** The total active stake, in {@link Lamports}, of the current epoch. */
    totalStake: Lamports;
}>;

export type GetBlockCommitmentApi = {
    /**
     * Returns the amount of cluster stake in {@link Lamports} that has voted on a particular block,
     * as well as the stake attributed to each vote account.
     * @see https://solana.com/docs/rpc/http/getblockcommitment
     */
    getBlockCommitment(slot: Slot): GetBlockCommitmentApiResponse;
};
