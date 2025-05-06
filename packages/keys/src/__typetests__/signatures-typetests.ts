import { EncodedString } from '@solana/nominal-types';

import { Signature, signature } from '../signatures';

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
