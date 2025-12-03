import { OffchainMessageWithRequiredSignatories } from './signatures';

export interface OffchainMessagePreambleV1 extends OffchainMessageWithRequiredSignatories {
    version: 1;
}
