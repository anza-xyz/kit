import { EncodedString } from '@solana/nominal-types';

import { Signature, signature, SignatureBytes, signatureBytes } from '../signatures';

// [DESCRIBE] signature()
{
    // It returns a `Signature`
    {
        signature('x') satisfies Signature;
    }
}

// [DESCRIBE] Signature
{
    // It satisfies the base58 encoded string brand
    {
        const signature = null as unknown as Signature;
        signature satisfies EncodedString<string, 'base58'>;
    }
}

// [DESCRIBE] signatureBytes()
{
    // It returns a `SignatureBytes`
    {
        signatureBytes(new Uint8Array(0)) satisfies SignatureBytes;
    }
}

// [DESCRIBE] SignatureBytes
{
    // It satisfies the `Uint8Array` type
    {
        const signatureBytes = null as unknown as SignatureBytes;
        signatureBytes satisfies Uint8Array;
    }
}
