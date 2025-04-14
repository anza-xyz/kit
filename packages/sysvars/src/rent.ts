import { assertAccountExists, decodeAccount, type FetchAccountConfig } from '@solana/accounts';
import {
    combineCodec,
    type FixedSizeCodec,
    type FixedSizeDecoder,
    type FixedSizeEncoder,
    getF64Decoder,
    getF64Encoder,
    getStructDecoder,
    getStructEncoder,
    getU8Decoder,
    getU8Encoder,
} from '@solana/codecs';
import type { GetAccountInfoApi } from '@solana/rpc-api';
import type { Rpc } from '@solana/rpc-spec';
import {
    F64UnsafeSeeDocumentation,
    getDefaultLamportsDecoder,
    getDefaultLamportsEncoder,
    type Lamports,
} from '@solana/rpc-types';

import { fetchEncodedSysvarAccount, SYSVAR_RENT_ADDRESS } from './sysvar';

type SysvarRentSize = 17;

/**
 * Configuration for network rent.
 */
export type SysvarRent = Readonly<{
    /**
     * The percentage of collected rent that is burned.
     *
     * Valid values are in the range [0, 100]. The remaining percentage is distributed to
     * validators.
     */
    burnPercent: number;
    /** Amount of time (in years) a balance must include rent for the account to be rent exempt */
    exemptionThreshold: F64UnsafeSeeDocumentation;
    /** Rental rate in {@link Lamports}/byte-year. */
    lamportsPerByteYear: Lamports;
}>;

/**
 * Returns an encoder that you can use to encode a {@link SysvarRent} to a byte array representing
 * the `Rent` sysvar's account data.
 */
export function getSysvarRentEncoder(): FixedSizeEncoder<SysvarRent, SysvarRentSize> {
    return getStructEncoder([
        ['lamportsPerByteYear', getDefaultLamportsEncoder()],
        ['exemptionThreshold', getF64Encoder()],
        ['burnPercent', getU8Encoder()],
    ]) as FixedSizeEncoder<SysvarRent, SysvarRentSize>;
}

/**
 * Returns a decoder that you can use to decode a byte array representing the `Rent` sysvar's
 * account data to a {@link SysvarRent}.
 */
export function getSysvarRentDecoder(): FixedSizeDecoder<SysvarRent, SysvarRentSize> {
    return getStructDecoder([
        ['lamportsPerByteYear', getDefaultLamportsDecoder()],
        ['exemptionThreshold', getF64Decoder()],
        ['burnPercent', getU8Decoder()],
    ]) as FixedSizeDecoder<SysvarRent, SysvarRentSize>;
}

/**
 * Returns a codec that you can use to encode from or decode to {@link SysvarRent}
 *
 * @see {@link getSysvarRentDecoder}
 * @see {@link getSysvarRentEncoder}
 */
export function getSysvarRentCodec(): FixedSizeCodec<SysvarRent, SysvarRent, SysvarRentSize> {
    return combineCodec(getSysvarRentEncoder(), getSysvarRentDecoder());
}

/**
 * Fetches the `Rent` sysvar account using any RPC that supports the {@link GetAccountInfoApi}.
 */
export async function fetchSysvarRent(rpc: Rpc<GetAccountInfoApi>, config?: FetchAccountConfig): Promise<SysvarRent> {
    const account = await fetchEncodedSysvarAccount(rpc, SYSVAR_RENT_ADDRESS, config);
    assertAccountExists(account);
    const decoded = decodeAccount(account, getSysvarRentDecoder());
    return decoded.data;
}
