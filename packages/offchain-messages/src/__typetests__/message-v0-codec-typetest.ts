import { ReadonlyUint8Array } from '@solana/codecs-core';

import { getOffchainMessageV0Decoder, getOffchainMessageV0Encoder } from '../codecs/message-v0';
import { OffchainMessage } from '../message';
import { OffchainMessageV0 } from '../message-v0';

// [DESCRIBE] getOffchainMessageV0Encoder.
{
    // It is incompatible with messages where the version is unknown
    {
        const message = null as unknown as OffchainMessage;
        // @ts-expect-error It's unclear until refined what version message you decoded.
        getOffchainMessageV0Encoder().encode(message);
    }

    // It returns a `ReadonlyUint8Array`
    {
        const message = null as unknown as OffchainMessageV0;
        const bytes = getOffchainMessageV0Encoder().encode(message);
        bytes satisfies ReadonlyUint8Array;
    }
}

// [DESCRIBE] getOffchainMessageV0Decoder.
{
    // It returns an `OffchainMessage` of version 0
    {
        const message = getOffchainMessageV0Decoder().decode(new Uint8Array([]));
        message satisfies OffchainMessage;
        message satisfies OffchainMessageV0;
    }
}
