import { address } from '@solana/addresses';

import { TransactionPartialSigner } from '../transaction-partial-signer';
import { assertIsTransactionSigner, isTransactionSigner, TransactionSigner } from '../transaction-signer';

const signTransactions = () => {};

{
    // [isTransactionSigner]: It keeps track of the address type parameter when the address is a valid Address.
    const potentialSigner = { address: address('1'), signTransactions };
    if (isTransactionSigner(potentialSigner)) {
        potentialSigner satisfies TransactionSigner<'1'>;
    }
}

{
    // [assertIsTransactionSigner]: It keeps track of the address type parameter when the address is a valid Address.
    const potentialSigner = { address: address('1'), signTransactions };
    assertIsTransactionSigner(potentialSigner);
    potentialSigner satisfies TransactionSigner<'1'>;
}

{
    // [isTransactionSigner]: It accepts a class instance, which has no implicit index signature.
    class MyClassBasedSigner implements TransactionPartialSigner<'1'> {
        readonly address = address('1');
        signTransactions() {
            return Promise.resolve([]);
        }
    }
    const potentialSigner = null as unknown as MyClassBasedSigner;
    if (isTransactionSigner(potentialSigner)) {
        potentialSigner satisfies TransactionSigner<'1'>;
    }
}

{
    // [assertIsTransactionSigner]: It accepts a class instance, which has no implicit index signature.
    class MyClassBasedSigner implements TransactionPartialSigner<'1'> {
        readonly address = address('1');
        signTransactions() {
            return Promise.resolve([]);
        }
    }
    const potentialSigner = null as unknown as MyClassBasedSigner;
    assertIsTransactionSigner(potentialSigner);
    potentialSigner satisfies TransactionSigner<'1'>;
}
