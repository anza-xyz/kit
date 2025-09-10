import { ReadonlyUint8Array } from '@solana/codecs-core';

import { getOffchainMessageDecoder, getOffchainMessageEncoder } from '../codecs/message';
import { OffchainMessage } from '../message';
import { OffchainMessageV0 } from '../message-v0';

// [DESCRIBE] getOffchainMessageEncoder.
{
    // It is compatible with messages of unknown version
    {
        const message = null as unknown as OffchainMessage;
        getOffchainMessageEncoder().encode(message);
    }

    // It is compatible with version 0 messages
    {
        const message = null as unknown as OffchainMessageV0;
        getOffchainMessageEncoder().encode(message);
    }

    // It returns a `ReadonlyUint8Array`
    {
        const message = null as unknown as OffchainMessage;
        const bytes = getOffchainMessageEncoder().encode(message);
        bytes satisfies ReadonlyUint8Array;
    }
}

// [DESCRIBE] getOffchainMessageDecoder.
{
    // It returns an `OffchainMessage`
    {
        const message = getOffchainMessageDecoder().decode(new Uint8Array([]));
        message satisfies OffchainMessage;
    }

    // It returns a message that is the union of all versions; no particular version
    {
        const message = getOffchainMessageDecoder().decode(new Uint8Array([]));
        message satisfies OffchainMessage;
        // TODO: This will start to properly fail when v1 is introduced.
        // @ENABLETHISTHENts-expect-error
        message satisfies OffchainMessageV0;
    }
}
