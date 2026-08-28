import { address } from '@solana/addresses';

import {
    assertIsTransactionModifyingSigner,
    isTransactionModifyingSigner,
    TransactionModifyingSigner,
} from '../transaction-modifying-signer';

const modifyAndSignTransactions = () => {};

{
    // [isTransactionModifyingSigner]: It keeps track of the address type parameter when the address is a valid Address.
    const potentialSigner = { address: address('1'), modifyAndSignTransactions };
    if (isTransactionModifyingSigner(potentialSigner)) {
        potentialSigner satisfies TransactionModifyingSigner<'1'>;
    }
}

{
    // [assertIsTransactionModifyingSigner]: It keeps track of the address type parameter when the address is a valid Address.
    const potentialSigner = { address: address('1'), modifyAndSignTransactions };
    assertIsTransactionModifyingSigner(potentialSigner);
    potentialSigner satisfies TransactionModifyingSigner<'1'>;
}

{
    // [isTransactionModifyingSigner]: It accepts a class instance, which has no implicit index signature.
    class MyClassBasedSigner implements TransactionModifyingSigner<'1'> {
        readonly address = address('1');
        modifyAndSignTransactions() {
            return Promise.resolve([]);
        }
    }
    const potentialSigner = null as unknown as MyClassBasedSigner;
    if (isTransactionModifyingSigner(potentialSigner)) {
        potentialSigner satisfies TransactionModifyingSigner<'1'>;
    }
}

{
    // [assertIsTransactionModifyingSigner]: It accepts a class instance, which has no implicit index signature.
    class MyClassBasedSigner implements TransactionModifyingSigner<'1'> {
        readonly address = address('1');
        modifyAndSignTransactions() {
            return Promise.resolve([]);
        }
    }
    const potentialSigner = null as unknown as MyClassBasedSigner;
    assertIsTransactionModifyingSigner(potentialSigner);
    potentialSigner satisfies TransactionModifyingSigner<'1'>;
}
