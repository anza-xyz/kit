import { Address } from '@solana/addresses';
import { CompressedData, EncodedString } from '@solana/nominal-types';

import { Base58EncodedBytes, Base64EncodedBytes, Base64EncodedZStdCompressedBytes } from '../encoded-bytes';

// [DESCRIBE] Base58EncodedBytes
{
    // It satisfies the base58 encoded string brand
    {
        const encodedBytes = null as unknown as Base58EncodedBytes;
        encodedBytes satisfies EncodedString<string, 'base58'>;
    }
    // It accepts an Address
    {
        const address = null as unknown as Address;
        address satisfies Base58EncodedBytes;
    }
    // A plain string is not assignable to it
    {
        const arbitrary = null as unknown as string;
        // @ts-expect-error A plain string lacks the base-58 encoding tag.
        arbitrary satisfies Base58EncodedBytes;
    }
}

// [DESCRIBE] Base64EncodedBytes
{
    // It satisfies the base64 encoded string brand
    {
        const encodedBytes = null as unknown as Base64EncodedBytes;
        encodedBytes satisfies EncodedString<string, 'base64'>;
    }
    // A plain string is not assignable to it
    {
        const arbitrary = null as unknown as string;
        // @ts-expect-error A plain string lacks the base-64 encoding tag.
        arbitrary satisfies Base64EncodedBytes;
    }
    // Base58 bytes are not assignable to it
    {
        const b58 = null as unknown as Base58EncodedBytes;
        // @ts-expect-error A base-58 encoded string is not a base-64 encoded string.
        b58 satisfies Base64EncodedBytes;
    }
    // An Address is not assignable to it
    {
        const address = null as unknown as Address;
        // @ts-expect-error An Address is base-58 encoded, not base-64.
        address satisfies Base64EncodedBytes;
    }
}

// [DESCRIBE] Base64EncodedZStdCompressedBytes
{
    // It satisfies the base64 encoded string brand
    {
        const encodedBytes = null as unknown as Base64EncodedZStdCompressedBytes;
        encodedBytes satisfies EncodedString<string, 'base64'>;
    }
    // It satisfies the ztd compressed data type
    {
        const encodedBytes = null as unknown as Base64EncodedZStdCompressedBytes;
        encodedBytes satisfies CompressedData<string, 'zstd'>;
    }
    // Plain base64 bytes are not assignable to it
    {
        const b64 = null as unknown as Base64EncodedBytes;
        // @ts-expect-error Uncompressed base-64 bytes are not zstd-compressed.
        b64 satisfies Base64EncodedZStdCompressedBytes;
    }
}
