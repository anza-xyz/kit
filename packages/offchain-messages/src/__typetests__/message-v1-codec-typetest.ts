import { ReadonlyUint8Array } from '@solana/codecs-core';

import { getOffchainMessageV1Decoder, getOffchainMessageV1Encoder } from '../codecs/message-v1';
import { OffchainMessage } from '../message';
import { OffchainMessageV1 } from '../message-v1';

// [DESCRIBE] getOffchainMessageV1Encoder.
{
    // It is incompatible with messages where the version is unknown
    {
        const message = null as unknown as OffchainMessage;
        // @ts-expect-error It's unclear until refined what version message you decoded.
        getOffchainMessageV1Encoder().encode(message);
    }

    // It returns a `ReadonlyUint8Array`
    {
        const message = null as unknown as OffchainMessageV1;
        const bytes = getOffchainMessageV1Encoder().encode(message);
        bytes satisfies ReadonlyUint8Array;
    }
}

// [DESCRIBE] getOffchainMessageV1Decoder.
{
    // It returns an `OffchainMessage` of version 1
    {
        const message = getOffchainMessageV1Decoder().decode(new Uint8Array([]));
        message satisfies OffchainMessage;
        message satisfies OffchainMessageV1;
    }
}
