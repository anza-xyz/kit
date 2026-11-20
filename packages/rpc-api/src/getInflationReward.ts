import type { Address } from '@solana/addresses';
import type { Commitment, Lamports, Slot } from '@solana/rpc-types';

type GetInflationRewardApiConfig = Readonly<{
    /**
     * Fetch the inflation reward details as of the highest slot that has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    /**
     * An epoch for which the reward occurs.
     *
     * @defaultValue If omitted, the previous epoch will be used.
     */
    epoch?: bigint;
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
}>;

type InflationReward = Readonly<{
    /** Reward amount in {@link Lamports} */
    amount: Lamports;
    /**
     * The block revenue (SIMD-0123) portion of `amount` for the queried address, in {@link Lamports}.
     * `amount` still contains inflation and block rewards combined, so the inflation reward alone is
     * `amount - blockRewardAmount`. `null` when block revenue sharing is not enabled in the epoch, and
     * absent on RPC nodes older than Agave 4.5.
     */
    blockRewardAmount?: Lamports | null;
    /** Vote account commission when the reward was credited */
    commission: number;
    /**
     * Vote account commission in basis points when the reward was credited (SIMD-0291). Absent when
     * the RPC does not set it.
     */
    commissionBps?: number;
    /** The slot in which the rewards are delivered */
    effectiveSlot: Slot;
    /** Epoch for which reward occurred */
    epoch: bigint;
    /** Post balance of the account in {@link Lamports} */
    postBalance: Lamports;
}>;

type GetInflationRewardApiResponse = readonly (InflationReward | null)[];

export type GetInflationRewardApi = {
    /**
     * Returns the inflation / staking reward for a list of addresses for an epoch.
     *
     * @see https://solana.com/docs/rpc/http/getinflationreward
     */
    getInflationReward(
        addresses: readonly Address[],
        config?: GetInflationRewardApiConfig,
    ): GetInflationRewardApiResponse;
};
