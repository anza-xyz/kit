type GetEpochScheduleApiResponse = Readonly<{
    /**
     * First normal-length epoch after the warmup period,
     * log2(slotsPerEpoch) - log2(MINIMUM_SLOTS_PER_EPOCH)
     */
    firstNormalEpoch: bigint;
    /**
     * The first slot after the warmup period, MINIMUM_SLOTS_PER_EPOCH * (2^(firstNormalEpoch) - 1)
     */
    firstNormalSlot: bigint;
    /**
     * The number of slots before beginning of an epoch to calculate a leader schedule for that
     * epoch
     */
    leaderScheduleSlotOffset: bigint;
    /** The maximum number of slots in each epoch */
    slotsPerEpoch: bigint;
    /** Whether epochs start short and grow */
    warmup: boolean;
}>;

export type GetEpochScheduleApi = {
    /**
     * Returns the epoch schedule information from this cluster's genesis config
     *
     * @see https://solana.com/docs/rpc/http/getepochschedule
     */
    getEpochSchedule(): GetEpochScheduleApiResponse;
};
