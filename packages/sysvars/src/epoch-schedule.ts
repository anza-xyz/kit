import { assertAccountExists, decodeAccount, type FetchAccountConfig } from '@solana/accounts';
import {
    combineCodec,
    type FixedSizeCodec,
    type FixedSizeDecoder,
    type FixedSizeEncoder,
    getBooleanDecoder,
    getBooleanEncoder,
    getStructDecoder,
    getStructEncoder,
    getU64Decoder,
    getU64Encoder,
} from '@solana/codecs';
import type { GetAccountInfoApi } from '@solana/rpc-api';
import type { Rpc } from '@solana/rpc-spec';
import type { Epoch, Slot } from '@solana/rpc-types';

import { fetchEncodedSysvarAccount, SYSVAR_EPOCH_SCHEDULE_ADDRESS } from './sysvar';

type SysvarEpochScheduleSize = 33;

/**
 * Includes the number of slots per epoch, timing of leader schedule selection, and information
 * about epoch warm-up time.
 */
export type SysvarEpochSchedule = Readonly<{
    /**
     * First normal-length epoch after the warmup period,
     * log2(slotsPerEpoch) - log2(MINIMUM_SLOTS_PER_EPOCH)
     */
    firstNormalEpoch: Epoch;
    /**
     * The first slot after the warmup period, MINIMUM_SLOTS_PER_EPOCH * (2^(firstNormalEpoch) - 1)
     */
    firstNormalSlot: Slot;
    /**
     * A number of slots before beginning of an epoch to calculate a leader schedule for that
     * epoch.
     */
    leaderScheduleSlotOffset: bigint;
    /** The maximum number of slots in each epoch */
    slotsPerEpoch: bigint;
    /** Whether epochs start short and grow */
    warmup: boolean;
}>;

/**
 * Returns an encoder that you can use to encode a {@link SysvarEpochSchedule} to a byte array
 * representing the `EpochSchedule` sysvar's account data.
 */
export function getSysvarEpochScheduleEncoder(): FixedSizeEncoder<SysvarEpochSchedule, SysvarEpochScheduleSize> {
    return getStructEncoder([
        ['slotsPerEpoch', getU64Encoder()],
        ['leaderScheduleSlotOffset', getU64Encoder()],
        ['warmup', getBooleanEncoder()],
        ['firstNormalEpoch', getU64Encoder()],
        ['firstNormalSlot', getU64Encoder()],
    ]) as FixedSizeEncoder<SysvarEpochSchedule, SysvarEpochScheduleSize>;
}

/**
 * Returns a decoder that you can use to decode a byte array representing the `EpochSchedule`
 * sysvar's account data to a {@link SysvarEpochSchedule}.
 */
export function getSysvarEpochScheduleDecoder(): FixedSizeDecoder<SysvarEpochSchedule, SysvarEpochScheduleSize> {
    return getStructDecoder([
        ['slotsPerEpoch', getU64Decoder()],
        ['leaderScheduleSlotOffset', getU64Decoder()],
        ['warmup', getBooleanDecoder()],
        ['firstNormalEpoch', getU64Decoder()],
        ['firstNormalSlot', getU64Decoder()],
    ]) as FixedSizeDecoder<SysvarEpochSchedule, SysvarEpochScheduleSize>;
}

/**
 * Returns a codec that you can use to encode from or decode to {@link SysvarEpochSchedule}
 *
 * @see {@link getSysvarEpochScheduleDecoder}
 * @see {@link getSysvarEpochScheduleEncoder}
 */
export function getSysvarEpochScheduleCodec(): FixedSizeCodec<
    SysvarEpochSchedule,
    SysvarEpochSchedule,
    SysvarEpochScheduleSize
> {
    return combineCodec(getSysvarEpochScheduleEncoder(), getSysvarEpochScheduleDecoder());
}

/**
 * Fetches the `EpochSchedule` sysvar account using any RPC that supports the
 * {@link GetAccountInfoApi}.
 */
export async function fetchSysvarEpochSchedule(
    rpc: Rpc<GetAccountInfoApi>,
    config?: FetchAccountConfig,
): Promise<SysvarEpochSchedule> {
    const account = await fetchEncodedSysvarAccount(rpc, SYSVAR_EPOCH_SCHEDULE_ADDRESS, config);
    assertAccountExists(account);
    const decoded = decodeAccount(account, getSysvarEpochScheduleDecoder());
    return decoded.data;
}
