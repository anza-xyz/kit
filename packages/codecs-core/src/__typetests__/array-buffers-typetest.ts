import { toArrayBuffer } from '../array-buffers';

// [DESCRIBE] toArrayBuffer.
{
    // It returns `ArrayBuffer` given a view with an underlying shared array buffer
    {
        const bytesWithSharedBuffer = null as unknown as Uint8Array<SharedArrayBuffer>;
        toArrayBuffer(bytesWithSharedBuffer) satisfies ArrayBuffer;
    }
}
