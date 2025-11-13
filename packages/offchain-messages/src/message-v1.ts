import { OffchainMessagePreambleV1 } from './preamble-v1';
import { OffchainMessageWithRequiredSignatories } from './signatures';

export type BaseOffchainMessageV1 = Omit<OffchainMessagePreambleV1, 'requiredSignatories'>;

export type OffchainMessageV1 = BaseOffchainMessageV1 &
    OffchainMessageWithRequiredSignatories &
    Readonly<{
        content: string;
    }>;
