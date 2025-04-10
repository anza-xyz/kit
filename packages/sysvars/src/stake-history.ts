import { assertAccountExists, decodeAccount, type FetchAccountConfig } from '@solana/accounts';
import {
    combineCodec,
    getArrayDecoder,
    getArrayEncoder,
    getStructDecoder,
    getStructEncoder,
    getU64Decoder,
    getU64Encoder,
    type VariableSizeCodec,
    type VariableSizeDecoder,
    type VariableSizeEncoder,
} from '@solana/codecs';
import type { GetAccountInfoApi } from '@solana/rpc-api';
import type { Rpc } from '@solana/rpc-spec';
import { Epoch, getDefaultLamportsDecoder, getDefaultLamportsEncoder, type Lamports } from '@solana/rpc-types';

import { fetchEncodedSysvarAccount, SYSVAR_STAKE_HISTORY_ADDRESS } from './sysvar';

type Entry = Readonly<{
    /** The epoch to which this stake history entry pertains */
    epoch: Epoch;
    stakeHistory: Readonly<{
        /**
         * Sum of portion of stakes requested to be warmed up, but not fully activated yet, in
         * {@link Lamports}
         */
        activating: Lamports;
        /**
         * Sum of portion of stakes requested to be cooled down, but not fully deactivated yet, in
         * {@link Lamports}
         */
        deactivating: Lamports;
        /** Effective stake at this epoch, in {@link Lamports} */
        effective: Lamports;
    }>;
}>;

/** History of stake activations and de-activations. */
export type SysvarStakeHistory = Entry[];

/**
 * Returns an encoder that you can use to encode a {@link SysvarStakeHistory} to a byte array
 * representing the `StakeHistory` sysvar's account data.
 */
export function getSysvarStakeHistoryEncoder(): VariableSizeEncoder<SysvarStakeHistory> {
    return getArrayEncoder(
        getStructEncoder([
            ['epoch', getU64Encoder()],
            [
                'stakeHistory',
                getStructEncoder([
                    ['effective', getDefaultLamportsEncoder()],
                    ['activating', getDefaultLamportsEncoder()],
                    ['deactivating', getDefaultLamportsEncoder()],
                ]),
            ],
        ]),
        { size: getU64Encoder() },
    );
}

/**
 * Returns a decoder that you can use to decode a byte array representing the `StakeHistory`
 * sysvar's account data to a {@link SysvarStakeHistory}.
 */
export function getSysvarStakeHistoryDecoder(): VariableSizeDecoder<SysvarStakeHistory> {
    return getArrayDecoder(
        getStructDecoder([
            ['epoch', getU64Decoder()],
            [
                'stakeHistory',
                getStructDecoder([
                    ['effective', getDefaultLamportsDecoder()],
                    ['activating', getDefaultLamportsDecoder()],
                    ['deactivating', getDefaultLamportsDecoder()],
                ]),
            ],
        ]),
        { size: getU64Decoder() },
    );
}

/**
 * Returns a codec that you can use to encode from or decode to {@link SysvarStakeHistory}
 *
 * @see {@link getSysvarStakeHistoryDecoder}
 * @see {@link getSysvarStakeHistoryEncoder}
 */
export function getSysvarStakeHistoryCodec(): VariableSizeCodec<SysvarStakeHistory> {
    return combineCodec(getSysvarStakeHistoryEncoder(), getSysvarStakeHistoryDecoder());
}

/**
 * Fetches the `StakeHistory` sysvar account using any RPC that supports the
 * {@link GetAccountInfoApi}.
 */
export async function fetchSysvarStakeHistory(
    rpc: Rpc<GetAccountInfoApi>,
    config?: FetchAccountConfig,
): Promise<SysvarStakeHistory> {
    const account = await fetchEncodedSysvarAccount(rpc, SYSVAR_STAKE_HISTORY_ADDRESS, config);
    assertAccountExists(account);
    const decoded = decodeAccount(account, getSysvarStakeHistoryDecoder());
    return decoded.data;
}
