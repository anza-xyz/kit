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
 * Tracks whether the rewards period (including calculation and distribution) is in progress, as
 * well as the details needed to resume distribution when starting from a snapshot during the
 * rewards period.
 *
 * The sysvar is repopulated at the start of the first block of each epoch. Therefore, the sysvar
 * contains data about the current epoch until a new epoch begins.
 */
export type SysvarEpochRewards = Readonly<{
    /** Whether the rewards period (including calculation and distribution) is active */
    active: boolean;
    /** The rewards currently distributed for the current epoch, in {@link Lamports} */
    distributedRewards: Lamports;
    /** The starting block height of the rewards distribution in the current epoch */
    distributionStartingBlockHeight: bigint;
    /**
     * Number of partitions in the rewards distribution in the current epoch, used to generate an
     * `EpochRewardsHasher`
     */
    numPartitions: bigint;
    /**
     * The {@link Blockhash} of the parent block of the first block in the epoch, used to seed an
     * `EpochRewardsHasher`
     */
    parentBlockhash: Blockhash;
    /**
     * The total rewards points calculated for the current epoch, where points equals the sum of
     * (delegated stake * credits observed) for all  delegations
     */
    totalPoints: bigint;
    /** The total rewards for the current epoch, in {@link Lamports} */
    totalRewards: Lamports;
}>;

/**
 * Returns an encoder that you can use to encode a {@link SysvarEpochRewards} to a byte array
 * representing the `EpochRewards` sysvar's account data.
 */
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

/**
 * Returns a decoder that you can use to decode a byte array representing the `EpochRewards`
 * sysvar's account data to a {@link SysvarEpochRewards}.
 */
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

/**
 * Returns a codec that you can use to encode from or decode to {@link SysvarEpochRewards}
 *
 * @see {@link getSysvarEpochRewardsDecoder}
 * @see {@link getSysvarEpochRewardsEncoder}
 */
export function getSysvarEpochRewardsCodec(): FixedSizeCodec<
    SysvarEpochRewards,
    SysvarEpochRewards,
    SysvarEpochRewardsSize
> {
    return combineCodec(getSysvarEpochRewardsEncoder(), getSysvarEpochRewardsDecoder());
}

/**
 * Fetch the `EpochRewards` sysvar account using any RPC that supports the
 * {@link GetAccountInfoApi}.
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
