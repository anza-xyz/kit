import { Address } from '@solana/addresses';

import { OffchainMessageApplicationDomain } from './application-domain';
import { OffchainMessageContentFormat } from './content';

export interface OffchainMessagePreambleV0 {
    applicationDomain: OffchainMessageApplicationDomain;
    messageFormat: OffchainMessageContentFormat;
    messageLength: number;
    requiredSigners: readonly Readonly<{ address: Address }>[];
    version: 0;
}
