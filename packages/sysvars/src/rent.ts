import { assertAccountExists, decodeAccount, type FetchAccountConfig } from '@solana/accounts';
import { combineCodec, type FixedSizeCodec, type FixedSizeDecoder, type FixedSizeEncoder, transformDecoder } from '@solana/codecs-core';
import { getStructDecoder, getStructEncoder } from '@solana/codecs-data-structures';
import { getF64Decoder, getF64Encoder, getU8Decoder, getU8Encoder } from '@solana/codecs-numbers';
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
     *
     * @deprecated Rent no longer exists (SIMD-0194).
     */
    burnPercent: number;
    /**
     * Formerly, the amount of time (in years) a balance must include rent for the account to be rent exempt.
     * Now deprecated — use {@link SysvarRent.lamportsPerByte | lamportsPerByte} directly to calculate the minimum balance.
     *
     * @deprecated Use {@link SysvarRent.lamportsPerByte | lamportsPerByte} directly (SIMD-0194).
     */
    exemptionThreshold: F64UnsafeSeeDocumentation;
    /** Rental rate in {@link Lamports} per byte of account storage. */
    lamportsPerByte: Lamports;
    /**
     * @deprecated Use {@link SysvarRent.lamportsPerByte | lamportsPerByte} instead (SIMD-0194).
     */
    lamportsPerByteYear?: Lamports;
}>;

/**
 * Returns an encoder that you can use to encode a {@link SysvarRent} to a byte array representing
 * the `Rent` sysvar's account data.
 */
export function getSysvarRentEncoder(): FixedSizeEncoder<SysvarRent, SysvarRentSize> {
    return getStructEncoder([
        ['lamportsPerByte', getDefaultLamportsEncoder()],
        ['exemptionThreshold', getF64Encoder()],
        ['burnPercent', getU8Encoder()],
    ]) as FixedSizeEncoder<SysvarRent, SysvarRentSize>;
}

/**
 * Returns a decoder that you can use to decode a byte array representing the `Rent` sysvar's
 * account data to a {@link SysvarRent}.
 */
export function getSysvarRentDecoder(): FixedSizeDecoder<SysvarRent, SysvarRentSize> {
    return transformDecoder(
        getStructDecoder([
            ['lamportsPerByte', getDefaultLamportsDecoder()],
            ['exemptionThreshold', getF64Decoder()],
            ['burnPercent', getU8Decoder()],
        ]),
        value => ({
            ...value,
            lamportsPerByteYear: value.lamportsPerByte,
        })
    ) as FixedSizeDecoder<SysvarRent, SysvarRentSize>;
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
