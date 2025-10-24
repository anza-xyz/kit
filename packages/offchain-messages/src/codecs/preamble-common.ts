import {
    getHiddenPrefixDecoder,
    getHiddenPrefixEncoder,
    getStructDecoder,
    getStructEncoder,
} from '@solana/codecs-data-structures';

import { getOffchainMessageSigningDomainDecoder, getOffchainMessageSigningDomainEncoder } from './signing-domain';
import { getOffchainMessageVersionDecoder, getOffchainMessageVersionEncoder } from './version';

type TDecoderFields = Parameters<typeof getStructDecoder>[0];
type TEncoderFields = Parameters<typeof getStructEncoder>[0];

export function createOffchainMessagePreambleDecoder<const T extends TDecoderFields>(...fields: T) {
    return getHiddenPrefixDecoder(getStructDecoder([['version', getOffchainMessageVersionDecoder()], ...fields]), [
        getOffchainMessageSigningDomainDecoder(),
    ]);
}

export function createOffchainMessagePreambleEncoder<const T extends TEncoderFields>(...fields: T) {
    return getHiddenPrefixEncoder(getStructEncoder([['version', getOffchainMessageVersionEncoder()], ...fields]), [
        getOffchainMessageSigningDomainEncoder(),
    ]);
}
