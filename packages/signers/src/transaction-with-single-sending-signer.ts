import {
    SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS,
    SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING,
    SolanaError,
} from '@solana/errors';
import { CompilableTransactionMessage } from '@solana/transaction-messages';

import { getSignersFromTransactionMessage, ITransactionMessageWithSigners } from './account-signer-meta';
import { isTransactionModifyingSigner } from './transaction-modifying-signer';
import { isTransactionPartialSigner } from './transaction-partial-signer';
import { isTransactionSendingSigner } from './transaction-sending-signer';

/**
 * Defines a transaction message with exactly one {@link TransactionSendingSigner}.
 *
 * This type is used to narrow the type of transaction messages that have been
 * checked to have exactly one sending signer.
 *
 * @example
 * ```ts
 * import { assertIsTransactionMessageWithSingleSendingSigner } from '@solana/signers';
 *
 * assertIsTransactionMessageWithSingleSendingSigner(transactionMessage);
 * transactionMessage satisfies ITransactionMessageWithSingleSendingSigner;
 * ```
 *
 * @see {@link isTransactionMessageWithSingleSendingSigner}
 * @see {@link assertIsTransactionMessageWithSingleSendingSigner}
 */
export type ITransactionMessageWithSingleSendingSigner = ITransactionMessageWithSigners & {
    readonly __transactionWithSingleSendingSigner: unique symbol;
};

/**
 * Checks whether the provided transaction has exactly one {@link TransactionSendingSigner}.
 *
 * This can be useful when using {@link signAndSendTransactionMessageWithSigners} to provide
 * a fallback strategy in case the transaction message cannot be send using this function.
 *
 * @typeParam TTransactionMessage - The inferred type of the transaction message provided.
 *
 * @example
 * ```ts
 * import {
 *     isTransactionMessageWithSingleSendingSigner,
 *     signAndSendTransactionMessageWithSigners,
 *     signTransactionMessageWithSigners,
 * } from '@solana/signers';
 * import { getBase64EncodedWireTransaction } from '@solana/transactions';
 *
 * let transactionSignature: SignatureBytes;
 * if (isTransactionMessageWithSingleSendingSigner(transactionMessage)) {
 *     transactionSignature = await signAndSendTransactionMessageWithSigners(transactionMessage);
 * } else {
 *     const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
 *     const encodedTransaction = getBase64EncodedWireTransaction(signedTransaction);
 *     transactionSignature = await rpc.sendTransaction(encodedTransaction).send();
 * }
 * ```
 *
 * @see {@link signAndSendTransactionMessageWithSigners}
 * @see {@link assertIsTransactionMessageWithSingleSendingSigner}
 */
export function isTransactionMessageWithSingleSendingSigner<TTransactionMessage extends CompilableTransactionMessage>(
    transaction: TTransactionMessage,
): transaction is ITransactionMessageWithSingleSendingSigner & TTransactionMessage {
    try {
        assertIsTransactionMessageWithSingleSendingSigner(transaction);
        return true;
    } catch {
        return false;
    }
}

/**
 * Asserts that the provided transaction message has exactly one {@link TransactionSendingSigner}.
 *
 * This can be useful when using the {@link signAndSendTransactionMessageWithSigners} function
 * to ensure it will be able to select the correct signer to send the transaction.
 *
 * @typeParam TTransactionMessage - The inferred type of the transaction message provided.
 *
 * @example
 * ```ts
 * import {
 *     assertIsTransactionMessageWithSingleSendingSigner,
 *     signAndSendTransactionMessageWithSigners
 * } from '@solana/signers';
 *
 * assertIsTransactionMessageWithSingleSendingSigner(transactionMessage);
 * const transactionSignature = await signAndSendTransactionMessageWithSigners(transactionMessage);
 * ```
 *
 * @see {@link signAndSendTransactionMessageWithSigners}
 * @see {@link isTransactionMessageWithSingleSendingSigner}
 */
export function assertIsTransactionMessageWithSingleSendingSigner<
    TTransactionMessage extends CompilableTransactionMessage,
>(
    transaction: TTransactionMessage,
): asserts transaction is ITransactionMessageWithSingleSendingSigner & TTransactionMessage {
    const signers = getSignersFromTransactionMessage(transaction);
    const sendingSigners = signers.filter(isTransactionSendingSigner);

    if (sendingSigners.length === 0) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING);
    }

    // When identifying if there are multiple sending signers, we only need to check for
    // sending signers that do not implement other transaction signer interfaces as
    // they will be used as these other signer interfaces in case of a conflict.
    const sendingOnlySigners = sendingSigners.filter(
        signer => !isTransactionPartialSigner(signer) && !isTransactionModifyingSigner(signer),
    );

    if (sendingOnlySigners.length > 1) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS);
    }
}
