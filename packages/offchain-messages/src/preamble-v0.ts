import { OffchainMessageApplicationDomain } from './application-domain';
import { OffchainMessageContentFormat } from './content';
import { OffchainMessageWithRequiredSignatories } from './signatures';

export interface OffchainMessagePreambleV0 extends OffchainMessageWithRequiredSignatories {
    applicationDomain: OffchainMessageApplicationDomain;
    messageFormat: OffchainMessageContentFormat;
    messageLength: number;
    version: 0;
}
