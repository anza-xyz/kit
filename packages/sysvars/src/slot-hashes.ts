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
import { type Blockhash, getBlockhashDecoder, getBlockhashEncoder, type Slot } from '@solana/rpc-types';

import { fetchEncodedSysvarAccount, SYSVAR_SLOT_HASHES_ADDRESS } from './sysvar';

type Entry = Readonly<{
    hash: Blockhash;
    slot: Slot;
}>;

/** The most recent hashes of a slot's parent banks. */
export type SysvarSlotHashes = Entry[];

/**
 * Returns an encoder that you can use to encode a {@link SysvarSlotHashes} to a byte array
 * representing the `SlotHashes` sysvar's account data.
 */
export function getSysvarSlotHashesEncoder(): VariableSizeEncoder<SysvarSlotHashes> {
    return getArrayEncoder(
        getStructEncoder([
            ['slot', getU64Encoder()],
            ['hash', getBlockhashEncoder()],
        ]),
    );
}

/**
 * Returns a decoder that you can use to decode a byte array representing the `SlotHashes` sysvar's
 * account data to a {@link SysvarSlotHashes}.
 */
export function getSysvarSlotHashesDecoder(): VariableSizeDecoder<SysvarSlotHashes> {
    return getArrayDecoder(
        getStructDecoder([
            ['slot', getU64Decoder()],
            ['hash', getBlockhashDecoder()],
        ]),
    );
}

/**
 * Returns a codec that you can use to encode from or decode to {@link SysvarSlotHashes}
 *
 * @see {@link getSysvarSlotHashesDecoder}
 * @see {@link getSysvarSlotHashesEncoder}
 */
export function getSysvarSlotHashesCodec(): VariableSizeCodec<SysvarSlotHashes> {
    return combineCodec(getSysvarSlotHashesEncoder(), getSysvarSlotHashesDecoder());
}

/**
 * Fetches the `SlotHashes` sysvar account using any RPC that supports the {@link GetAccountInfoApi}.
 */
export async function fetchSysvarSlotHashes(
    rpc: Rpc<GetAccountInfoApi>,
    config?: FetchAccountConfig,
): Promise<SysvarSlotHashes> {
    const account = await fetchEncodedSysvarAccount(rpc, SYSVAR_SLOT_HASHES_ADDRESS, config);
    assertAccountExists(account);
    const decoded = decodeAccount(account, getSysvarSlotHashesDecoder());
    return decoded.data;
}
