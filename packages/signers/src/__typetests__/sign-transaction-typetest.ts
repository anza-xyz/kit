/* eslint-disable @typescript-eslint/no-floating-promises */
import { SignatureBytes } from '@solana/keys';
import {
    TransactionMessage,
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
    partiallySignTransactionWithSigners,
    signAndSendTransactionMessageWithSigners,
    signAndSendTransactionWithSigners,
    signTransactionMessageWithSigners,
    signTransactionWithSigners,
} from '../sign-transaction';
import { TransactionModifyingSigner } from '../transaction-modifying-signer';
import { TransactionPartialSigner } from '../transaction-partial-signer';
import { TransactionSendingSigner } from '../transaction-sending-signer';
import { TransactionSigner } from '../transaction-signer';
import { TransactionMessageWithSingleSendingSigner } from '../transaction-with-single-sending-signer';

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with a lifetime when the input message has a blockhash lifetime
    const transactionMessage = null as unknown as TransactionMessage &
        TransactionMessageWithBlockhashLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with a lifetime when the input message has a durable nonce lifetime
    const transactionMessage = null as unknown as TransactionMessage &
        TransactionMessageWithDurableNonceLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with an unknown lifetime when the input message has an unknown lifetime
    const transactionMessage = null as unknown as TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithLifetime &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with a lifetime when the input message has no lifetime
    const transactionMessage = null as unknown as TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<Readonly<Transaction>>;
    partiallySignTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [partiallySignTransactionMessageWithSigners]: returns a transaction with a `TransactionWithinSizeLimit` flag
    const transactionMessage = null as unknown as TransactionMessage &
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
    const transactionMessage = null as unknown as TransactionMessage &
        TransactionMessageWithBlockhashLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a fully signed transaction with a lifetime when the input message has a durable nonce lifetime
    const transactionMessage = null as unknown as TransactionMessage &
        TransactionMessageWithDurableNonceLifetime &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a fully signed transaction with an unknown lifetime when the input message has an unknown lifetime
    const transactionMessage = null as unknown as TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithLifetime &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a transaction with a lifetime when the input message has no lifetime
    const transactionMessage = null as unknown as TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithSigners;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<Readonly<Transaction>>;
    signTransactionMessageWithSigners(transactionMessage) satisfies Promise<
        Readonly<Transaction & TransactionWithLifetime>
    >;
}

{
    // [signTransactionMessageWithSigners]: returns a transaction with a `TransactionWithinSizeLimit` flag
    const transactionMessage = null as unknown as TransactionMessage &
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
    const transactionMessage = null as unknown as TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithLifetime &
        TransactionMessageWithSigners &
        TransactionMessageWithSingleSendingSigner;
    signAndSendTransactionMessageWithSigners(transactionMessage) satisfies Promise<SignatureBytes>;
}

{
    // [partiallySignTransactionWithSigners]: returns a Transaction & TransactionWithinSizeLimit & TransactionWithLifetime
    const signers = null as unknown as readonly (TransactionModifyingSigner | TransactionPartialSigner)[];
    const transaction = null as unknown as Transaction;
    partiallySignTransactionWithSigners(signers, transaction) satisfies Promise<
        Readonly<Transaction & TransactionWithinSizeLimit & TransactionWithLifetime>
    >;
}

{
    // [partiallySignTransactionWithSigners]: accepts a composite signer that is both a TransactionSendingSigner and a TransactionPartialSigner
    const signers = null as unknown as readonly (TransactionPartialSigner & TransactionSendingSigner)[];
    const transaction = null as unknown as Transaction;
    partiallySignTransactionWithSigners(signers, transaction);
}

{
    // [partiallySignTransactionWithSigners]: does not accept a TransactionSendingSigner on its own
    const signers = null as unknown as readonly TransactionSendingSigner[];
    const transaction = null as unknown as Transaction;
    // @ts-expect-error TransactionSendingSigner is not assignable to TransactionModifyingSigner | TransactionPartialSigner
    partiallySignTransactionWithSigners(signers, transaction);
}

{
    // [signTransactionWithSigners]: returns a FullySignedTransaction & Transaction & TransactionWithLifetime
    const signers = null as unknown as readonly (TransactionModifyingSigner | TransactionPartialSigner)[];
    const transaction = null as unknown as Transaction;
    signTransactionWithSigners(signers, transaction) satisfies Promise<
        Readonly<FullySignedTransaction & Transaction & TransactionWithLifetime>
    >;
}

{
    // [signTransactionWithSigners]: accepts a composite signer that is both a TransactionSendingSigner and a TransactionPartialSigner
    const signers = null as unknown as readonly (TransactionPartialSigner & TransactionSendingSigner)[];
    const transaction = null as unknown as Transaction;
    signTransactionWithSigners(signers, transaction);
}

{
    // [signTransactionWithSigners]: does not accept a TransactionSendingSigner on its own
    const signers = null as unknown as readonly TransactionSendingSigner[];
    const transaction = null as unknown as Transaction;
    // @ts-expect-error TransactionSendingSigner is not assignable to TransactionModifyingSigner | TransactionPartialSigner
    signTransactionWithSigners(signers, transaction);
}

{
    // [signAndSendTransactionWithSigners]: returns SignatureBytes
    const signers = null as unknown as readonly TransactionSigner[];
    const transaction = null as unknown as Transaction;
    signAndSendTransactionWithSigners(signers, transaction) satisfies Promise<SignatureBytes>;
}
