import type { Blockhash, Epoch, Slot, StringifiedBigInt, UnixTimestamp } from '@solana/rpc-types';

import { RpcParsedType } from './rpc-parsed-type';

type FeeCalculator = Readonly<{
    lamportsPerSignature: StringifiedBigInt;
}>;

type JsonParsedClockAccount = Readonly<{
    epoch: Epoch;
    epochStartTimestamp: UnixTimestamp;
    leaderScheduleEpoch: Epoch;
    slot: Slot;
    unixTimestamp: UnixTimestamp;
}>;

type JsonParsedEpochScheduleAccount = Readonly<{
    firstNormalEpoch: Epoch;
    firstNormalSlot: Slot;
    leaderScheduleSlotOffset: bigint;
    slotsPerEpoch: bigint;
    warmup: boolean;
}>;

type JsonParsedFeesAccount_DEPRECATED = Readonly<{
    feeCalculator: FeeCalculator;
}>;

type JsonParsedRecentBlockhashesAccount_DEPRECATED = Readonly<{
    blockhash: Blockhash;
    feeCalculator: FeeCalculator;
}>[];

/**
 * The shape of the parsed rent sysvar returned by validators running Agave versions prior to
 * 4.1.0.
 *
 * @deprecated Agave 4.1.0 reshaped the parsed rent sysvar to {@link JsonParsedRentAccount}. Narrow on the
 * presence of `lamportsPerByte` (current) versus `lamportsPerByteYear` (deprecated) to tell the
 * two apart.
 */
type JsonParsedRentAccount_DEPRECATED = Readonly<{
    burnPercent: number;
    exemptionThreshold: number;
    lamportsPerByteYear: StringifiedBigInt;
}>;

type JsonParsedRentAccount = Readonly<{
    lamportsPerByte: StringifiedBigInt;
}>;

type JsonParsedSlotHashesAccount = Readonly<{
    hash: string;
    slot: Slot;
}>[];

type JsonParsedSlotHistoryAccount = Readonly<{
    bits: string;
    nextSlot: Slot;
}>;

type JsonParsedStakeHistoryAccount = Readonly<{
    epoch: Epoch;
    stakeHistory: Readonly<{
        activating: bigint;
        deactivating: bigint;
        effective: bigint;
    }>;
}>[];

type JsonParsedLastRestartSlotAccount = Readonly<{
    lastRestartSlot: Slot;
}>;

type JsonParsedEpochRewardsAccount = Readonly<{
    distributedRewards: bigint;
    distributionCompleteBlockHeight: bigint;
    totalRewards: bigint;
}>;

export type JsonParsedSysvarAccount =
    | RpcParsedType<'clock', JsonParsedClockAccount>
    | RpcParsedType<'epochRewards', JsonParsedEpochRewardsAccount>
    | RpcParsedType<'epochSchedule', JsonParsedEpochScheduleAccount>
    | RpcParsedType<'fees', JsonParsedFeesAccount_DEPRECATED>
    | RpcParsedType<'lastRestartSlot', JsonParsedLastRestartSlotAccount>
    | RpcParsedType<'recentBlockhashes', JsonParsedRecentBlockhashesAccount_DEPRECATED>
    | RpcParsedType<'rent', JsonParsedRentAccount | JsonParsedRentAccount_DEPRECATED>
    | RpcParsedType<'slotHashes', JsonParsedSlotHashesAccount>
    | RpcParsedType<'slotHistory', JsonParsedSlotHistoryAccount>
    | RpcParsedType<'stakeHistory', JsonParsedStakeHistoryAccount>;
