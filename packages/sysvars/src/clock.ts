import { assertAccountExists, decodeAccount, type FetchAccountConfig } from '@solana/accounts';
import {
    combineCodec,
    type FixedSizeCodec,
    type FixedSizeDecoder,
    type FixedSizeEncoder,
    getI64Decoder,
    getI64Encoder,
    getStructDecoder,
    getStructEncoder,
    getU64Decoder,
    getU64Encoder,
} from '@solana/codecs';
import type { GetAccountInfoApi } from '@solana/rpc-api';
import type { Rpc } from '@solana/rpc-spec';
import type { Epoch, Slot, UnixTimestamp } from '@solana/rpc-types';

import { fetchEncodedSysvarAccount, SYSVAR_CLOCK_ADDRESS } from './sysvar';

type SysvarClockSize = 40;

/**
 * Contains data on cluster time, including the current slot, epoch, and estimated wall-clock Unix
 * timestamp. It is updated every slot.
 */
export type SysvarClock = Readonly<{
    /** The current epoch */
    epoch: Epoch;
    /**
     * The Unix timestamp of the first slot in this epoch.
     *
     * In the first slot of an epoch, this timestamp is identical to the `unixTimestamp`.
     */
    epochStartTimestamp: UnixTimestamp;
    /** The most recent epoch for which the leader schedule has already been generated */
    leaderScheduleEpoch: Epoch;
    /** The current slot */
    slot: Slot;
    /** The Unix timestamp of this slot */
    unixTimestamp: UnixTimestamp;
}>;

/**
 * Returns an encoder that you can use to encode a {@link SysvarClock} to a byte array representing
 * the `Clock` sysvar's account data.
 */
export function getSysvarClockEncoder(): FixedSizeEncoder<SysvarClock, SysvarClockSize> {
    return getStructEncoder([
        ['slot', getU64Encoder()],
        ['epochStartTimestamp', getI64Encoder()],
        ['epoch', getU64Encoder()],
        ['leaderScheduleEpoch', getU64Encoder()],
        ['unixTimestamp', getI64Encoder()],
    ]) as FixedSizeEncoder<SysvarClock, SysvarClockSize>;
}

/**
 * Returns a decoder that you can use to decode a byte array representing the `Clock` sysvar's
 * account data to a {@link SysvarClock}.
 */
export function getSysvarClockDecoder(): FixedSizeDecoder<SysvarClock, SysvarClockSize> {
    return getStructDecoder([
        ['slot', getU64Decoder()],
        ['epochStartTimestamp', getI64Decoder()],
        ['epoch', getU64Decoder()],
        ['leaderScheduleEpoch', getU64Decoder()],
        ['unixTimestamp', getI64Decoder()],
    ]) as FixedSizeDecoder<SysvarClock, SysvarClockSize>;
}

/**
 * Returns a codec that you can use to encode from or decode to {@link SysvarClock}
 *
 * @see {@link getSysvarClockDecoder}
 * @see {@link getSysvarClockEncoder}
 */
export function getSysvarClockCodec(): FixedSizeCodec<SysvarClock, SysvarClock, SysvarClockSize> {
    return combineCodec(getSysvarClockEncoder(), getSysvarClockDecoder());
}

/**
 * Fetches the `Clock` sysvar account using any RPC that supports the {@link GetAccountInfoApi}.
 */
export async function fetchSysvarClock(rpc: Rpc<GetAccountInfoApi>, config?: FetchAccountConfig): Promise<SysvarClock> {
    const account = await fetchEncodedSysvarAccount(rpc, SYSVAR_CLOCK_ADDRESS, config);
    assertAccountExists(account);
    const decoded = decodeAccount(account, getSysvarClockDecoder());
    return decoded.data;
}
