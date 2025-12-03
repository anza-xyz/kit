import { assertAccountExists, decodeAccount, type FetchAccountConfig } from '@solana/accounts';
import {
    combineCodec,
    getArrayDecoder,
    getArrayEncoder,
    getStructDecoder,
    getStructEncoder,
    type VariableSizeCodec,
    type VariableSizeDecoder,
    type VariableSizeEncoder,
} from '@solana/codecs';
import type { GetAccountInfoApi } from '@solana/rpc-api';
import type { Rpc } from '@solana/rpc-spec';
import {
    type Blockhash,
    getBlockhashDecoder,
    getBlockhashEncoder,
    getDefaultLamportsDecoder,
    getDefaultLamportsEncoder,
    type Lamports,
} from '@solana/rpc-types';

import { fetchEncodedSysvarAccount, SYSVAR_RECENT_BLOCKHASHES_ADDRESS } from './sysvar';

type FeeCalculator = Readonly<{
    /**
     * The current cost of a signature.
     *
     * This amount may increase/decrease over time based on cluster processing load
     */
    lamportsPerSignature: Lamports;
}>;
type Entry = Readonly<{
    blockhash: Blockhash;
    feeCalculator: FeeCalculator;
}>;

/**
 * Information about recent blocks and their fee calculators.
 *
 * @deprecated Transaction fees should be determined with the
 * {@link GetFeeForMessageApi.getFeeForMessage} RPC method. For additional context see the
 * [Comprehensive Compute Fees proposal](https://docs.anza.xyz/proposals/comprehensive-compute-fees/).
 */
export type SysvarRecentBlockhashes = Entry[];

/**
 * Returns an encoder that you can use to encode a {@link SysvarRecentBlockhashes} to a byte array
 * representing the `RecentBlockhashes` sysvar's account data.
 *
 * @deprecated Transaction fees should be determined with the
 * {@link GetFeeForMessageApi.getFeeForMessage} RPC method. For additional context see the
 * [Comprehensive Compute Fees proposal](https://docs.anza.xyz/proposals/comprehensive-compute-fees/).
 */
export function getSysvarRecentBlockhashesEncoder(): VariableSizeEncoder<SysvarRecentBlockhashes> {
    return getArrayEncoder(
        getStructEncoder([
            ['blockhash', getBlockhashEncoder()],
            ['feeCalculator', getStructEncoder([['lamportsPerSignature', getDefaultLamportsEncoder()]])],
        ]),
    );
}

/**
 * Returns a decoder that you can use to decode a byte array representing the `RecentBlockhashes`
 * sysvar's account data to a {@link SysvarRecentBlockhashes}.
 *
 * @deprecated Transaction fees should be determined with the
 * {@link GetFeeForMessageApi.getFeeForMessage} RPC method. For additional context see the
 * [Comprehensive Compute Fees proposal](https://docs.anza.xyz/proposals/comprehensive-compute-fees/).
 */
export function getSysvarRecentBlockhashesDecoder(): VariableSizeDecoder<SysvarRecentBlockhashes> {
    return getArrayDecoder(
        getStructDecoder([
            ['blockhash', getBlockhashDecoder()],
            ['feeCalculator', getStructDecoder([['lamportsPerSignature', getDefaultLamportsDecoder()]])],
        ]),
    );
}

/**
 * Returns a codec that you can use to encode from or decode to {@link SysvarRecentBlockhashes}
 *
 * @deprecated Transaction fees should be determined with the
 * {@link GetFeeForMessageApi.getFeeForMessage} RPC method. For additional context see the
 * [Comprehensive Compute Fees proposal](https://docs.anza.xyz/proposals/comprehensive-compute-fees/).
 *
 * @see {@link getSysvarRecentBlockhashesDecoder}
 * @see {@link getSysvarRecentBlockhashesEncoder}
 */
export function getSysvarRecentBlockhashesCodec(): VariableSizeCodec<SysvarRecentBlockhashes> {
    return combineCodec(getSysvarRecentBlockhashesEncoder(), getSysvarRecentBlockhashesDecoder());
}

/**
 * Fetches the `RecentBlockhashes` sysvar account using any RPC that supports the
 * {@link GetAccountInfoApi}.
 *
 * @deprecated Transaction fees should be determined with the
 * {@link GetFeeForMessageApi.getFeeForMessage} RPC method. For additional context see the
 * [Comprehensive Compute Fees proposal](https://docs.anza.xyz/proposals/comprehensive-compute-fees/).
 */
export async function fetchSysvarRecentBlockhashes(
    rpc: Rpc<GetAccountInfoApi>,
    config?: FetchAccountConfig,
): Promise<SysvarRecentBlockhashes> {
    const account = await fetchEncodedSysvarAccount(rpc, SYSVAR_RECENT_BLOCKHASHES_ADDRESS, config);
    assertAccountExists(account);
    const decoded = decodeAccount(account, getSysvarRecentBlockhashesDecoder());
    return decoded.data;
}
