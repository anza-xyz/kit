import { EncodedString } from '@solana/nominal-types';

import { Transaction } from '../transaction';
import { getBase64EncodedWireTransaction } from '../wire-transaction';

const transaction = null as unknown as Transaction;

// [DESCRIBE] getBase64EncodedWireTransaction
{
    // The return value satisfies the base64 encoded string brand
    {
        getBase64EncodedWireTransaction(transaction) satisfies EncodedString<string, 'base64'>;
    }
}
