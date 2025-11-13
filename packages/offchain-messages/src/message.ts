import { ReadonlyUint8Array } from '@solana/codecs-core';
import { Brand } from '@solana/nominal-types';

import { OffchainMessageV0 } from './message-v0';
import { OffchainMessageV1 } from './message-v1';

export type OffchainMessage = OffchainMessageV0 | OffchainMessageV1;
export type OffchainMessageBytes = Brand<ReadonlyUint8Array, 'OffchainMessageBytes'>;
