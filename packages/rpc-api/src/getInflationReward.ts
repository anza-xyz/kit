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
    // An epoch for which the reward occurs.
    // If omitted, the previous epoch will be used
    epoch?: bigint;
    // The minimum slot that the request can be evaluated at
    minContextSlot?: Slot;
}>;

type InflationReward = Readonly<{
    // Reward amount in lamports
    amount: Lamports;
    // Vote account commission when the reward was credited
    commission: number;
    // The slot in which the rewards are effective
    effectiveSlot: Slot;
    // Epoch for which reward occurred
    epoch: bigint;
    // Post balance of the account in lamports
    postBalance: Lamports;
}>;

type GetInflationRewardApiResponse = readonly (InflationReward | null)[];

export type GetInflationRewardApi = {
    /**
     * Returns the inflation / staking reward for a list of addresses for an epoch
     */
    getInflationReward(addresses: Address[], config?: GetInflationRewardApiConfig): GetInflationRewardApiResponse;
};
