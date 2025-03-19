import type { Address } from '@solana/addresses';
import type { Commitment, Slot } from '@solana/rpc-types';

type GetLeaderScheduleApiConfigBase = Readonly<{
    /**
     * Fetch the leader schedule as of the highest slot that has reached this level of commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
}>;

// A dictionary of validator identities as base-58 encoded strings, and their corresponding leader
// slot indices as values relative to the first slot in the requested epoch.
//
// @example
// ```json
// {
//   "4Qkev8aNZcqFNSRhQzwyLMFSsi94jHqE8WNVTJzTP99F": [
//     0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
//     21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
//     39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
//     57, 58, 59, 60, 61, 62, 63
//   ]
// }
// ```
type GetLeaderScheduleApiResponseWithAllIdentities = Record<Address, Slot[]>;

type GetLeaderScheduleApiResponseWithSingleIdentity<TIdentity extends string> = Readonly<{
    [TAddress in TIdentity]?: Slot[];
}>;

export type GetLeaderScheduleApi = {
    /**
     * Fetch the leader schedule of a particular validator.
     *
     * @param slot A slot that will be used to select the epoch for which to return the leader
     * schedule.
     *
     * @returns A dictionary having a single key representing the specified validator identity, and
     * its corresponding leader slot indices as values relative to the first slot in the requested
     * epoch, or `null` if there is no epoch that corresponds to the given slot.
     * @see https://solana.com/docs/rpc/http/getleaderschedule
     */
    getLeaderSchedule<TIdentity extends Address>(
        slot: Slot,
        config: GetLeaderScheduleApiConfigBase &
            Readonly<{
                /** Only return results for this validator identity (base58 encoded address) */
                identity: Address;
            }>,
    ): GetLeaderScheduleApiResponseWithSingleIdentity<TIdentity> | null;
    /**
     * Fetch the leader schedule for all validators.
     *
     * @param slot A slot that will be used to select the epoch for which to return the leader
     * schedule.
     *
     * @returns A dictionary of validator identities as base-58 encoded strings, and their
     * corresponding leader slot indices as values relative to the first slot in the requested
     * epoch, or `null` if there is no epoch that corresponds to the given slot.
     * @see https://solana.com/docs/rpc/http/getleaderschedule
     */
    getLeaderSchedule(
        slot: Slot,
        config?: GetLeaderScheduleApiConfigBase,
    ): GetLeaderScheduleApiResponseWithAllIdentities | null;
    /**
     * Fetch the leader schedule of a particular validator.
     *
     * @param slot When `null`, orders the leader schedule for the current epoch.
     *
     * @returns A dictionary having a single key representing the specified validator identity, and
     * its corresponding leader slot indices as values relative to the first slot in the current
     * epoch.
     * @see https://solana.com/docs/rpc/http/getleaderschedule
     */
    getLeaderSchedule<TIdentity extends Address>(
        slot: null,
        config: GetLeaderScheduleApiConfigBase &
            Readonly<{
                /** Only return results for this validator identity (base58 encoded address) */
                identity: Address;
            }>,
    ): GetLeaderScheduleApiResponseWithSingleIdentity<TIdentity>;
    /**
     * Fetch the leader schedule of all validators.
     *
     * @param slot When `null`, orders the leader schedule for the current epoch.
     *
     * @returns A dictionary of validator identities as base-58 encoded strings, and their
     * corresponding leader slot indices as values relative to the first slot in the current
     * epoch.
     * @see https://solana.com/docs/rpc/http/getleaderschedule
     */
    getLeaderSchedule(
        slot?: null,
        config?: GetLeaderScheduleApiConfigBase,
    ): GetLeaderScheduleApiResponseWithAllIdentities;
};
