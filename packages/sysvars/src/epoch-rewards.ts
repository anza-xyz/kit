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
    getU128Decoder,
    getU128Encoder,
} from '@solana/codecs';
import type { GetAccountInfoApi } from '@solana/rpc-api';
import type { Rpc } from '@solana/rpc-spec';
import {
    Blockhash,
    getBlockhashDecoder,
    getBlockhashEncoder,
    getDefaultLamportsDecoder,
    getDefaultLamportsEncoder,
    Lamports,
} from '@solana/rpc-types';

import { fetchEncodedSysvarAccount, SYSVAR_EPOCH_REWARDS_ADDRESS } from './sysvar';

type SysvarEpochRewardsSize = 81;

/**
 * The `EpochRewards` sysvar.
 *
 * Tracks the progress of epoch rewards distribution. It includes:
 * - Total rewards for the current epoch, in lamports.
 * - Rewards for the current epoch distributed so far, in lamports.
 * - Distribution completed block height, i.e. distribution of all staking rewards for the current
 *   epoch will be completed at this block height.
 *
 * Note that `EpochRewards` only lasts for a handful of blocks at the start of
 * an epoch. When all rewards have been distributed, the sysvar is deleted.
 * See https://github.com/anza-xyz/agave/blob/e0203f22dc83cb792fa97f91dbe6e924cbd08af1/docs/src/runtime/sysvars.md?plain=1#L155-L168
 */
export type SysvarEpochRewards = Readonly<{
    active: boolean;
    distributedRewards: Lamports;
    distributionStartingBlockHeight: bigint;
    numPartitions: bigint;
    parentBlockhash: Blockhash;
    totalPoints: bigint;
    totalRewards: Lamports;
}>;

export function getSysvarEpochRewardsEncoder(): FixedSizeEncoder<SysvarEpochRewards, SysvarEpochRewardsSize> {
    return getStructEncoder([
        ['distributionStartingBlockHeight', getU64Encoder()],
        ['numPartitions', getU64Encoder()],
        ['parentBlockhash', getBlockhashEncoder()],
        ['totalPoints', getU128Encoder()],
        ['totalRewards', getDefaultLamportsEncoder()],
        ['distributedRewards', getDefaultLamportsEncoder()],
        ['active', getBooleanEncoder()],
    ]) as FixedSizeEncoder<SysvarEpochRewards, SysvarEpochRewardsSize>;
}

export function getSysvarEpochRewardsDecoder(): FixedSizeDecoder<SysvarEpochRewards, SysvarEpochRewardsSize> {
    return getStructDecoder([
        ['distributionStartingBlockHeight', getU64Decoder()],
        ['numPartitions', getU64Decoder()],
        ['parentBlockhash', getBlockhashDecoder()],
        ['totalPoints', getU128Decoder()],
        ['totalRewards', getDefaultLamportsDecoder()],
        ['distributedRewards', getDefaultLamportsDecoder()],
        ['active', getBooleanDecoder()],
    ]) as FixedSizeDecoder<SysvarEpochRewards, SysvarEpochRewardsSize>;
}

export function getSysvarEpochRewardsCodec(): FixedSizeCodec<
    SysvarEpochRewards,
    SysvarEpochRewards,
    SysvarEpochRewardsSize
> {
    return combineCodec(getSysvarEpochRewardsEncoder(), getSysvarEpochRewardsDecoder());
}

/**
 * Fetch the `EpochRewards` sysvar.
 *
 * Tracks the progress of epoch rewards distribution. It includes:
 * - Total rewards for the current epoch, in lamports.
 * - Rewards for the current epoch distributed so far, in lamports.
 * - Distribution completed block height, i.e. distribution of all staking rewards for the current
 *   epoch will be completed at this block height.
 *
 * Note that `EpochRewards` only lasts for a handful of blocks at the start of
 * an epoch. When all rewards have been distributed, the sysvar is deleted.
 * See https://github.com/anza-xyz/agave/blob/e0203f22dc83cb792fa97f91dbe6e924cbd08af1/docs/src/runtime/sysvars.md?plain=1#L155-L168
 */
export async function fetchSysvarEpochRewards(
    rpc: Rpc<GetAccountInfoApi>,
    config?: FetchAccountConfig,
): Promise<SysvarEpochRewards> {
    const account = await fetchEncodedSysvarAccount(rpc, SYSVAR_EPOCH_REWARDS_ADDRESS, config);
    assertAccountExists(account);
    const decoded = decodeAccount(account, getSysvarEpochRewardsDecoder());
    return decoded.data;
}
