import {
    CompilableTransactionMessage,
    compileTransactionMessage,
    getCompiledTransactionMessageEncoder,
    isTransactionMessageWithBlockhashLifetime,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithDurableNonceLifetime,
} from '@solana/transaction-messages';

import {
    TransactionWithBlockhashLifetime,
    TransactionWithDurableNonceLifetime,
    TransactionWithLifetime,
} from './lifetime';
import { SignaturesMap, Transaction, TransactionMessageBytes } from './transaction';

/**
 * Returns a {@link Transaction} object for a given {@link TransactionMessage}.
 *
 * This includes the compiled bytes of the transaction message, and a map of signatures. This map
 * will have a key for each address that is required to sign the transaction. The transaction will
 * not yet have signatures for any of these addresses.
 *
 * Whether a transaction message is ready to be compiled or not is enforced for you at the type
 * level. In order to be signable, a transaction message must:
 *
 * - have a version and a list of zero or more instructions (ie. conform to
 *   {@link BaseTransactionMessage})
 * - have a fee payer set (ie. conform to {@link ITransactionMessageWithFeePayer})
 * - have a lifetime specified (ie. conform to {@link TransactionMessageWithBlockhashLifetime} or
 *   {@link TransactionMessageWithDurableNonceLifetime})
 */
export function compileTransaction(
    transactionMessage: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime,
): Readonly<Transaction & TransactionWithBlockhashLifetime>;

export function compileTransaction(
    transactionMessage: CompilableTransactionMessage & TransactionMessageWithDurableNonceLifetime,
): Readonly<Transaction & TransactionWithDurableNonceLifetime>;

export function compileTransaction(
    transactionMessage: CompilableTransactionMessage,
): Readonly<Transaction & TransactionWithLifetime>;

export function compileTransaction(
    transactionMessage: CompilableTransactionMessage,
): Readonly<Transaction & TransactionWithLifetime> {
    const compiledMessage = compileTransactionMessage(transactionMessage);
    const messageBytes = getCompiledTransactionMessageEncoder().encode(compiledMessage) as TransactionMessageBytes;

    const transactionSigners = compiledMessage.staticAccounts.slice(0, compiledMessage.header.numSignerAccounts);
    const signatures: SignaturesMap = {};
    for (const signerAddress of transactionSigners) {
        signatures[signerAddress] = null;
    }

    let lifetimeConstraint: TransactionWithLifetime['lifetimeConstraint'];
    if (isTransactionMessageWithBlockhashLifetime(transactionMessage)) {
        lifetimeConstraint = {
            blockhash: transactionMessage.lifetimeConstraint.blockhash,
            lastValidBlockHeight: transactionMessage.lifetimeConstraint.lastValidBlockHeight,
        };
    } else {
        lifetimeConstraint = {
            nonce: transactionMessage.lifetimeConstraint.nonce,
            nonceAccountAddress: transactionMessage.instructions[0].accounts[0].address,
        };
    }

    const transaction: Transaction & TransactionWithLifetime = {
        lifetimeConstraint,
        messageBytes: messageBytes,
        signatures: Object.freeze(signatures),
    };

    return Object.freeze(transaction);
}
