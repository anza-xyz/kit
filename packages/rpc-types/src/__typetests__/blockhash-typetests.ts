import { EncodedString } from '@solana/nominal-types';

import { Blockhash } from '../blockhash';

// [DESCRIBE] Blockhash
{
    // It satisfies the base58 encoded string brand
    {
        const blockhash = null as unknown as Blockhash;
        blockhash satisfies EncodedString<string, 'base58'>;
    }
}
