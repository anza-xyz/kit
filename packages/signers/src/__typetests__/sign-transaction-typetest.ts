/* eslint-disable @typescript-eslint/no-floating-promises */
import { SignatureBytes } from '@solana/keys';
import {
    BaseTransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithDurableNonceLifetime,
    TransactionMessageWithFeePayer,
    TransactionMessageWithinSizeLimit,
    TransactionMessageWithLifetime,
} from '@solana/transaction-messages';
import {
    FullySignedTransaction,
    Transaction,
    TransactionWithinSizeLimit,
    TransactionWithLifetime,
} from '@solana/transactions';

import { TransactionMessageWithSigners } from '../account-signer-meta';
import {
    partiallySignTransactionMessageWithSigners,
    signAndSendTransactionMessageWithSigners,
    signTransactionMessageWithSigners,
} from '../sign-transaction';
import { TransactionMessageWithSingleSendingSigner } from '../transaction-with-single-sending-signer';

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with a lifetime when the input message has a blockhash lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithBlockhashLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with a lifetime when the input message has a durable nonce lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithDurableNonceLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with an unknown lifetime when the input message has an unknown lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithLifetime &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with a lifetime when the input message has no lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<Readonly<Transaction>>;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with a `TransactionWithinSizeLimit` flag
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithinSizeLimit &
        TransactionMessageWithLifetime &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithinSizeLimit>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a fully signed transaction with a lifetime when the input message has a blockhash lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithBlockhashLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a fully signed transaction with a lifetime when the input message has a durable nonce lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithDurableNonceLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a fully signed transaction with an unknown lifetime when the input message has an unknown lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithLifetime &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a transaction with a lifetime when the input message has no lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<Readonly<Transaction>>;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a transaction with a `TransactionWithinSizeLimit` flag
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithinSizeLimit &
        TransactionMessageWithLifetime &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithinSizeLimit>
    >;
}

{
    // [signAndSendTransactionMessageWithSigners]: returns a signature
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithLifetime &
        TransactionMessageWithSigners &
        TransactionMessageWithSingleSendingSigner;
    signAndSendTransactionMessageWithSigners(transactionMessage) satisfies Promise<SignatureBytes>;
}
