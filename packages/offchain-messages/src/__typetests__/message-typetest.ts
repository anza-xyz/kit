import { OffchainMessage } from '../message';
import { OffchainMessageV0 } from '../message-v0';
import { OffchainMessageV1 } from '../message-v1';

// [DESCRIBE] `OffchainMessage`.
{
    // Can be refined by asserting on its version number
    {
        const message = null as unknown as OffchainMessage;
        // @ts-expect-error It's unclear until refined what version message you decoded.
        message satisfies OffchainMessageV0;
        if (message.version === 0) {
            message satisfies OffchainMessageV0;
        }
        // @ts-expect-error It's unclear until refined what version message you decoded.
        message satisfies OffchainMessageV1;
        if (message.version === 1) {
            message satisfies OffchainMessageV1;
        }
    }
}
