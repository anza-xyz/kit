import { getAddressDecoder, getAddressEncoder } from '@solana/addresses';
import {
    combineCodec,
    type Encoder,
    type VariableSizeCodec,
    type VariableSizeDecoder,
    type VariableSizeEncoder,
} from '@solana/codecs-core';
import { getArrayDecoder, getArrayEncoder, getStructDecoder, getStructEncoder } from '@solana/codecs-data-structures';
import { getShortU16Decoder, getShortU16Encoder, getU8Decoder, getU8Encoder } from '@solana/codecs-numbers';

import type { getCompiledAddressTableLookups } from '../compile/address-table-lookups';

type AddressTableLookup = ReturnType<typeof getCompiledAddressTableLookups>[number];

let memoizedAddressTableLookupEncoder: VariableSizeEncoder<AddressTableLookup> | undefined;
export function getAddressTableLookupEncoder(): VariableSizeEncoder<AddressTableLookup> {
    if (!memoizedAddressTableLookupEncoder) {
        const indexEncoder = getArrayEncoder(getU8Encoder(), { size: getShortU16Encoder() }) as Encoder<
            readonly number[]
        >;
        memoizedAddressTableLookupEncoder = getStructEncoder([
            ['lookupTableAddress', getAddressEncoder()],
            ['writableIndexes', indexEncoder],
            ['readonlyIndexes', indexEncoder],
        ]);
    }

    return memoizedAddressTableLookupEncoder;
}

let memoizedAddressTableLookupDecoder: VariableSizeDecoder<AddressTableLookup> | undefined;
export function getAddressTableLookupDecoder(): VariableSizeDecoder<AddressTableLookup> {
    if (!memoizedAddressTableLookupDecoder) {
        const indexEncoder = getArrayDecoder(getU8Decoder(), { size: getShortU16Decoder() });
        memoizedAddressTableLookupDecoder = getStructDecoder([
            ['lookupTableAddress', getAddressDecoder()],
            ['writableIndexes', indexEncoder],
            ['readonlyIndexes', indexEncoder],
        ]);
    }

    return memoizedAddressTableLookupDecoder;
}

export function getAddressTableLookupCodec(): VariableSizeCodec<AddressTableLookup> {
    return combineCodec(getAddressTableLookupEncoder(), getAddressTableLookupDecoder());
}
