import { bytesEqual } from '@solana/codecs-core';
import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';

import { getTransactionCodec } from './codecs';
import { getTransactionLifetimeConstraintFromCompiledTransactionMessage, TransactionWithLifetime } from './lifetime';
import { Transaction } from './transaction';
import { assertIsTransactionWithinSizeLimit, TransactionWithinSizeLimit } from './transaction-size';

/**
 * Reconstructs a signed transaction from encoded bytes using an optional original transaction.
 *
 * Wallets often sign raw transaction bytes and return the encoded transaction. When decoding
 * this back into a structured `Transaction`, we may lose the original `lifetimeConstraint`.
 *
 * This helper attempts to preserve the existing lifetime when possible to avoid unnecessary
 * transaction message decoding. If the transaction has changed or no lifetime exists, the
 * lifetime constraint is recomputed from the compiled transaction message.
 *
 * @param originalTransaction - The original transaction before signing.
 * @param encodedTransaction - The encoded signed transaction returned by the wallet.
 *
 * @returns A reconstructed transaction including size validation and lifetime constraint.
 */
export async function reconstructEncodedTransactionFromOriginalTransaction(
    originalTransaction: Transaction | (Transaction & TransactionWithLifetime) | undefined,
    encodedTransaction: Uint8Array,
): Promise<Transaction & TransactionWithinSizeLimit & TransactionWithLifetime> {
    const transactionCodec = getTransactionCodec();

    const decodedSignedTransaction = transactionCodec.decode(encodedTransaction);

    assertIsTransactionWithinSizeLimit(decodedSignedTransaction);

    const existingLifetime =
        originalTransaction && 'lifetimeConstraint' in originalTransaction
            ? (originalTransaction as TransactionWithLifetime).lifetimeConstraint
            : undefined;

    if (existingLifetime && originalTransaction) {
        if (bytesEqual(decodedSignedTransaction.messageBytes, originalTransaction.messageBytes)) {
            return Object.freeze({
                ...decodedSignedTransaction,
                lifetimeConstraint: existingLifetime,
            });
        }

        const compiledTransactionMessage = getCompiledTransactionMessageDecoder().decode(
            decodedSignedTransaction.messageBytes,
        );

        const currentToken = 'blockhash' in existingLifetime ? existingLifetime.blockhash : existingLifetime.nonce;

        if (compiledTransactionMessage.lifetimeToken === currentToken) {
            return Object.freeze({
                ...decodedSignedTransaction,
                lifetimeConstraint: existingLifetime,
            });
        }
    }

    const compiledTransactionMessage = getCompiledTransactionMessageDecoder().decode(
        decodedSignedTransaction.messageBytes,
    );

    const lifetimeConstraint =
        await getTransactionLifetimeConstraintFromCompiledTransactionMessage(compiledTransactionMessage);

    return Object.freeze({
        ...decodedSignedTransaction,
        lifetimeConstraint,
    });
}
