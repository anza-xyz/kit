import { Address } from '@solana/addresses';
import { Epoch, Slot, StringifiedBigInt, UnixTimestamp } from '@solana/rpc-types';

import { RpcParsedInfo } from './rpc-parsed-type';

export type JsonParsedVoteAccount = RpcParsedInfo<{
    authorizedVoters: Readonly<{
        authorizedVoter: Address;
        epoch: Epoch;
    }>[];
    authorizedWithdrawer: Address;
    /** The address that collects block revenue (tips/MEV) */
    blockRevenueCollector: Address;
    /** Block revenue commission in basis points */
    blockRevenueCommissionBps: bigint;
    /** Compressed BLS public key, or `null` if not set */
    blsPubkeyCompressed: string | null;
    commission: number;
    epochCredits: Readonly<{
        credits: StringifiedBigInt;
        epoch: Epoch;
        previousCredits: StringifiedBigInt;
    }>[];
    /** The address that collects inflation rewards */
    inflationRewardsCollector: Address;
    /** Inflation rewards commission in basis points */
    inflationRewardsCommissionBps: bigint;
    lastTimestamp: Readonly<{
        slot: Slot;
        timestamp: UnixTimestamp;
    }>;
    nodePubkey: Address;
    /** Pending delegator rewards */
    pendingDelegatorRewards: StringifiedBigInt;
    priorVoters: Readonly<{
        authorizedPubkey: Address;
        epochOfLastAuthorizedSwitch: Epoch;
        targetEpoch: Epoch;
    }>[];
    rootSlot: Slot | null;
    votes: Readonly<{
        confirmationCount: number;
        /** The latency of this vote, in slots */
        latency: bigint;
        slot: Slot;
    }>[];
}>;
