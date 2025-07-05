/* eslint-disable @typescript-eslint/no-floating-promises */
import { Signature } from '@solana/keys';

import {
    assertIsFullySignedTransaction,
    FullySignedTransaction,
    getSignatureFromTransaction,
    isFullySignedTransaction,
    partiallySignTransaction,
    signTransaction,
    TransactionWithLifetime,
} from '..';
import { Transaction } from '../transaction';

// getSignatureFromTransaction
{
    const transaction = null as unknown as Transaction & { some: 1 };
    getSignatureFromTransaction(transaction) satisfies Signature;
}

// partiallySignTransaction
{
    const transaction = null as unknown as Transaction & TransactionWithLifetime & { some: 1 };
    partiallySignTransaction([], transaction) satisfies Promise<Transaction & { some: 1 }>;
}

// signTransaction
{
    const transaction = null as unknown as Transaction & TransactionWithLifetime & { some: 1 };
    signTransaction([], transaction) satisfies Promise<FullySignedTransaction & { some: 1 }>;
}

// isFullySignedTransaction
{
    const transaction = null as unknown as Transaction & { some: 1 };
    if (isFullySignedTransaction(transaction)) {
        transaction satisfies FullySignedTransaction & Transaction & { some: 1 };
    }
}

// assertIsFullySignedTransaction
{
    const transaction = null as unknown as Transaction & { some: 1 };
    assertIsFullySignedTransaction(transaction);
    transaction satisfies FullySignedTransaction & Transaction & { some: 1 };
}
