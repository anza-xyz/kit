import { address } from '@solana/addresses';

import {
    assertIsTransactionSendingSigner,
    isTransactionSendingSigner,
    TransactionSendingSigner,
} from '../transaction-sending-signer';

const signAndSendTransactions = () => {};

{
    // [isTransactionSendingSigner]: It keeps track of the address type parameter when the address is a valid Address.
    const potentialSigner = { address: address('1'), signAndSendTransactions };
    if (isTransactionSendingSigner(potentialSigner)) {
        potentialSigner satisfies TransactionSendingSigner<'1'>;
    }
}

{
    // [assertIsTransactionSendingSigner]: It keeps track of the address type parameter when the address is a valid Address.
    const potentialSigner = { address: address('1'), signAndSendTransactions };
    assertIsTransactionSendingSigner(potentialSigner);
    potentialSigner satisfies TransactionSendingSigner<'1'>;
}

{
    // [isTransactionSendingSigner]: It accepts a class instance, which has no implicit index signature.
    class MyClassBasedSigner implements TransactionSendingSigner<'1'> {
        readonly address = address('1');
        signAndSendTransactions() {
            return Promise.resolve([]);
        }
    }
    const potentialSigner = null as unknown as MyClassBasedSigner;
    if (isTransactionSendingSigner(potentialSigner)) {
        potentialSigner satisfies TransactionSendingSigner<'1'>;
    }
}

{
    // [assertIsTransactionSendingSigner]: It accepts a class instance, which has no implicit index signature.
    class MyClassBasedSigner implements TransactionSendingSigner<'1'> {
        readonly address = address('1');
        signAndSendTransactions() {
            return Promise.resolve([]);
        }
    }
    const potentialSigner = null as unknown as MyClassBasedSigner;
    assertIsTransactionSendingSigner(potentialSigner);
    potentialSigner satisfies TransactionSendingSigner<'1'>;
}
