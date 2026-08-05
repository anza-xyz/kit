import { OffchainMessage } from '../message';
import { OffchainMessageV0 } from '../message-v0';
import { assertOffchainMessageV1Equal, OffchainMessageV1 } from '../message-v1';

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

    // Must be refined to a version 1 message before it can be compared with one
    {
        const message = null as unknown as OffchainMessage;
        const expectedMessage = null as unknown as OffchainMessageV1;
        // @ts-expect-error It's unclear until refined what version message you decoded.
        assertOffchainMessageV1Equal(message, expectedMessage);
        if (message.version === 1) {
            assertOffchainMessageV1Equal(message, expectedMessage);
        }
    }
}
