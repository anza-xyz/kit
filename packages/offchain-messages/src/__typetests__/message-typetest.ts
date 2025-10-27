import { OffchainMessage } from '../message';
import { OffchainMessageV0 } from '../message-v0';

// [DESCRIBE] `OffchainMessage`.
{
    // Can be refined by asserting on its version number
    {
        const message = null as unknown as OffchainMessage;
        // TODO: This will start to properly fail when v1 is introduced.
        // @ENABLETHISTHENts-expect-error
        message satisfies OffchainMessageV0;
        if (message.version === 0) {
            message satisfies OffchainMessageV0;
        }
    }
}
