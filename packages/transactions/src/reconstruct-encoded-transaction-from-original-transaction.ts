import { bytesEqual, type ReadonlyUint8Array } from '@solana/codecs-core';
import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';

import { getTransactionCodec } from './codecs';
import {
    getTransactionLifetimeConstraintFromCompiledTransactionMessage,
    type TransactionWithLifetime,
} from './lifetime';
import type { Transaction } from './transaction';
import { assertIsTransactionWithinSizeLimit, type TransactionWithinSizeLimit } from './transaction-size';

/**
 * Rebuilds a signed transaction from wallet-returned bytes and attaches a lifetime constraint.
 *
 * Wallet `TransactionModifyingSigner` implementations typically receive encoded bytes back from
 * the wallet. Decoding those bytes alone loses `lifetimeConstraint`. This helper restores it from
 * the original transaction when the compiled lifetime token is unchanged, and otherwise derives a
 * new constraint from the compiled message.
 *
 * @param originalTransaction - The transaction that was sent to the wallet, with or without a
 * lifetime constraint.
 * @param encodedTransaction - The signed transaction bytes returned by the wallet.
 * @return The decoded signed transaction, asserted to be within the size limit, with a lifetime
 * constraint attached.
 * @throws {SolanaError} If the decoded transaction exceeds the size limit, or if a new durable
 * nonce lifetime cannot be derived from the compiled message.
 *
 * @example
 * ```ts
 * import { reconstructEncodedTransactionFromOriginalTransaction } from '@solana/transactions';
 *
 * const transactionWithLifetime = await reconstructEncodedTransactionFromOriginalTransaction(
 *     originalTransaction,
 *     signedTransactionBytes,
 * );
 * transactionWithLifetime.lifetimeConstraint;
 * ```
 *
 * @see {@link assertIsTransactionWithinSizeLimit}
 * @see {@link getTransactionLifetimeConstraintFromCompiledTransactionMessage}
 */
export async function reconstructEncodedTransactionFromOriginalTransaction(
    originalTransaction: Transaction | (Transaction & TransactionWithLifetime),
    encodedTransaction: ReadonlyUint8Array | Uint8Array,
): Promise<Transaction & TransactionWithinSizeLimit & TransactionWithLifetime> {
    const decodedSignedTransaction = getTransactionCodec().decode(encodedTransaction);
    assertIsTransactionWithinSizeLimit(decodedSignedTransaction);

    const existingLifetime =
        'lifetimeConstraint' in originalTransaction ? originalTransaction.lifetimeConstraint : undefined;

    if (existingLifetime && bytesEqual(decodedSignedTransaction.messageBytes, originalTransaction.messageBytes)) {
        return Object.freeze({
            ...decodedSignedTransaction,
            lifetimeConstraint: existingLifetime,
        });
    }

    const compiledTransactionMessage = getCompiledTransactionMessageDecoder().decode(
        decodedSignedTransaction.messageBytes,
    );

    if (existingLifetime) {
        const currentToken = 'blockhash' in existingLifetime ? existingLifetime.blockhash : existingLifetime.nonce;
        if (compiledTransactionMessage.lifetimeToken === currentToken) {
            return Object.freeze({
                ...decodedSignedTransaction,
                lifetimeConstraint: existingLifetime,
            });
        }
    }

    const lifetimeConstraint =
        await getTransactionLifetimeConstraintFromCompiledTransactionMessage(compiledTransactionMessage);
    return Object.freeze({
        ...decodedSignedTransaction,
        lifetimeConstraint,
    });
}
