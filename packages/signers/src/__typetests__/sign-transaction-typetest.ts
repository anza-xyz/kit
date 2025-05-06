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
    TransactionWithBlockhashLifetime,
    TransactionWithDurableNonceLifetime,
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
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with a blockhash lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithBlockhashLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithBlockhashLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with a durable nonce lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithDurableNonceLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithDurableNonceLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with an unknown lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithLifetime &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with no lifetime constraint
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<Readonly<Transaction>>;
    // @ts-expect-error Expects no lifetime constraint
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
    // [signTransactionMessageWithSigners]: returns a fully signed transaction with a blockhash lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithBlockhashLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithBlockhashLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a fully signed transaction with a durable nonce lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithDurableNonceLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithDurableNonceLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a fully signed transaction with an unknown lifetime
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithLifetime &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a transaction with no lifetime constraint
    const transactionMessage = null as unknown as BaseTransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<Readonly<Transaction>>;
    // @ts-expect-error Expects no lifetime constraint
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
