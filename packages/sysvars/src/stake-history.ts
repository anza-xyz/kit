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
    epoch: Epoch;
    stakeHistory: Readonly<{
        activating: Lamports;
        deactivating: Lamports;
        effective: Lamports;
    }>;
}>;

/**
 * The `StakeHistory` sysvar.
 *
 * History of stake activations and de-activations.
 */
export type SysvarStakeHistory = Entry[];

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

export function getSysvarStakeHistoryCodec(): VariableSizeCodec<SysvarStakeHistory> {
    return combineCodec(getSysvarStakeHistoryEncoder(), getSysvarStakeHistoryDecoder());
}

/**
 * Fetch the `StakeHistory` sysvar.
 *
 * History of stake activations and de-activations.
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
