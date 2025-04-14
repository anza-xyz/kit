import { SOLANA_ERROR__TRANSACTION__EXPECTED_BLOCKHASH_LIFETIME, SolanaError } from '@solana/errors';
import { assertIsBlockhash, type Blockhash } from '@solana/rpc-types';

import { TransactionMessageWithDurableNonceLifetime } from './durable-nonce';
import { BaseTransactionMessage } from './transaction-message';

type BlockhashLifetimeConstraint = Readonly<{
    blockhash: Blockhash;
    lastValidBlockHeight: bigint;
}>;

export interface TransactionMessageWithBlockhashLifetime {
    readonly lifetimeConstraint: BlockhashLifetimeConstraint;
}

export function isTransactionMessageWithBlockhashLifetime(
    transactionMessage: BaseTransactionMessage | (BaseTransactionMessage & TransactionMessageWithBlockhashLifetime),
): transactionMessage is BaseTransactionMessage & TransactionMessageWithBlockhashLifetime {
    const lifetimeConstraintShapeMatches =
        'lifetimeConstraint' in transactionMessage &&
        typeof transactionMessage.lifetimeConstraint.blockhash === 'string' &&
        typeof transactionMessage.lifetimeConstraint.lastValidBlockHeight === 'bigint';
    if (!lifetimeConstraintShapeMatches) return false;
    try {
        assertIsBlockhash(transactionMessage.lifetimeConstraint.blockhash);
        return true;
    } catch {
        return false;
    }
}

export function assertIsTransactionMessageWithBlockhashLifetime(
    transactionMessage: BaseTransactionMessage | (BaseTransactionMessage & TransactionMessageWithBlockhashLifetime),
): asserts transactionMessage is BaseTransactionMessage & TransactionMessageWithBlockhashLifetime {
    if (!isTransactionMessageWithBlockhashLifetime(transactionMessage)) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXPECTED_BLOCKHASH_LIFETIME);
    }
}

export function setTransactionMessageLifetimeUsingBlockhash<
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime,
>(
    blockhashLifetimeConstraint: BlockhashLifetimeConstraint,
    transactionMessage: TTransactionMessage,
): Omit<TTransactionMessage, 'lifetimeConstraint'> & TransactionMessageWithBlockhashLifetime;

export function setTransactionMessageLifetimeUsingBlockhash<
    TTransactionMessage extends
        | BaseTransactionMessage
        | (BaseTransactionMessage & TransactionMessageWithBlockhashLifetime),
>(
    blockhashLifetimeConstraint: BlockhashLifetimeConstraint,
    transactionMessage: TTransactionMessage,
): TransactionMessageWithBlockhashLifetime & TTransactionMessage;

export function setTransactionMessageLifetimeUsingBlockhash(
    blockhashLifetimeConstraint: BlockhashLifetimeConstraint,
    transactionMessage: BaseTransactionMessage | (BaseTransactionMessage & TransactionMessageWithBlockhashLifetime),
) {
    if (
        'lifetimeConstraint' in transactionMessage &&
        transactionMessage.lifetimeConstraint.blockhash === blockhashLifetimeConstraint.blockhash &&
        transactionMessage.lifetimeConstraint.lastValidBlockHeight === blockhashLifetimeConstraint.lastValidBlockHeight
    ) {
        return transactionMessage;
    }
    const out = {
        ...transactionMessage,
        lifetimeConstraint: Object.freeze(blockhashLifetimeConstraint),
    };
    Object.freeze(out);
    return out;
}
