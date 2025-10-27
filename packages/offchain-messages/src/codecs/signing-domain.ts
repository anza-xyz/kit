import {
    combineCodec,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    ReadonlyUint8Array,
} from '@solana/codecs-core';
import { getConstantDecoder, getConstantEncoder } from '@solana/codecs-data-structures';

// The string `'\xffsolana offchain'`
const OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES: ReadonlyUint8Array = new Uint8Array([
    0xff, 0x73, 0x6f, 0x6c, 0x61, 0x6e, 0x61, 0x20, 0x6f, 0x66, 0x66, 0x63, 0x68, 0x61, 0x69, 0x6e,
]);

export function getOffchainMessageSigningDomainDecoder(): FixedSizeDecoder<void, 16> {
    return getConstantDecoder(OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES) as FixedSizeDecoder<void, 16>;
}

export function getOffchainMessageSigningDomainEncoder(): FixedSizeEncoder<void, 16> {
    return getConstantEncoder(OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES) as FixedSizeEncoder<void, 16>;
}

export function getOffchainMessageSigningDomainCodec(): FixedSizeCodec<void, void, 16> {
    return combineCodec(getOffchainMessageSigningDomainEncoder(), getOffchainMessageSigningDomainDecoder());
}
