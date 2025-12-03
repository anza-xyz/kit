import { EncodedString } from '@solana/nominal-types';

import { TransactionMessageBytesBase64 } from '../transaction';

// [DESCRIBE] TransactionMessageBytesBase64
{
    // It satisfies the base64 encoded string brand
    {
        const encodedBytes = null as unknown as TransactionMessageBytesBase64;
        encodedBytes satisfies EncodedString<string, 'base64'>;
    }
}
