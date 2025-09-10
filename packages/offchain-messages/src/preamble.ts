import { Address } from '@solana/addresses';

import { OffchainMessageApplicationDomain } from './application-domain';
import { OffchainMessageContentFormat } from './content';
import { OffchainMessageVersion } from './version';

export interface OffchainMessagePreamble {
    applicationDomain: OffchainMessageApplicationDomain;
    messageFormat: OffchainMessageContentFormat;
    messageLength: number;
    requiredSigners: readonly Readonly<{ address: Address }>[];
    version: OffchainMessageVersion;
}
