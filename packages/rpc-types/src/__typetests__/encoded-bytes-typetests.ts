import { CompressedData, EncodedString } from '@solana/nominal-types';

import { Base58EncodedBytes, Base64EncodedBytes, Base64EncodedZStdCompressedBytes } from '../encoded-bytes';

// [DESCRIBE] Base58EncodedBytes
{
    // It satisfies the base58 encoded string brand
    {
        const encodedBytes = null as unknown as Base58EncodedBytes;
        encodedBytes satisfies EncodedString<string, 'base58'>;
    }
}

// [DESCRIBE] Base64EncodedBytes
{
    // It satisfies the base64 encoded string brand
    {
        const encodedBytes = null as unknown as Base64EncodedBytes;
        encodedBytes satisfies EncodedString<string, 'base64'>;
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
}
