import { ReadonlyUint8Array } from '@solana/codecs-core';
import { Brand } from '@solana/nominal-types';

import { OffchainMessageV0 } from './message-v0';
import { OffchainMessageSignatory } from './signatures';

export type OffchainMessage = OffchainMessageV0;
export type OffchainMessageBytes = Brand<ReadonlyUint8Array, 'OffchainMessageBytes'>;
export interface OffchainMessageWithRequiredSignatories<TAddress extends string = string> {
    requiredSignatories: readonly OffchainMessageSignatory<TAddress>[];
}
