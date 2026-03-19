import {
    SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS,
    SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING,
    SolanaError,
} from '@solana/errors';
import { Brand } from '@solana/nominal-types';
import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';

import { getSignersFromTransactionMessage, TransactionMessageWithSigners } from './account-signer-meta';
import { isTransactionModifyingSigner } from './transaction-modifying-signer';
import { isTransactionPartialSigner } from './transaction-partial-signer';
import { isTransactionSendingSigner } from './transaction-sending-signer';
import { TransactionSigner } from './transaction-signer';

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
 * transactionMessage satisfies TransactionMessageWithSingleSendingSigner;
 * ```
 *
 * @see {@link isTransactionMessageWithSingleSendingSigner}
 * @see {@link assertIsTransactionMessageWithSingleSendingSigner}
 */
export type TransactionMessageWithSingleSendingSigner = Brand<
    TransactionMessageWithSigners,
    'TransactionMessageWithSingleSendingSigner'
>;

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
export function isTransactionMessageWithSingleSendingSigner<
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer,
>(transaction: TTransactionMessage): transaction is TransactionMessageWithSingleSendingSigner & TTransactionMessage {
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
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer,
>(
    transaction: TTransactionMessage,
): asserts transaction is TransactionMessageWithSingleSendingSigner & TTransactionMessage {
    assertContainsResolvableTransactionSendingSigner(getSignersFromTransactionMessage(transaction));
}

/**
 * Asserts that the provided signers contain at least one {@link TransactionSendingSigner}
 * that can be unambiguously resolved.
 *
 * This means the signers must contain at least one sending signer, and at most one
 * sending-only signer (i.e. a signer that implements {@link TransactionSendingSigner}
 * but not {@link TransactionPartialSigner} or {@link TransactionModifyingSigner}).
 * Composite signers that also implement other interfaces can be demoted to non-sending
 * roles, so multiple composite sending signers are allowed.
 *
 * @param signers - The signers to check.
 * @throws {@link SolanaError} with code {@link SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING}
 * if no sending signer is found.
 * @throws {@link SolanaError} with code {@link SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS}
 * if more than one sending-only signer is found.
 *
 * @example
 * ```ts
 * assertContainsResolvableTransactionSendingSigner(mySigners);
 * const signature = await signAndSendTransactionWithSigners(mySigners, compiledTransaction);
 * ```
 *
 * @see {@link signAndSendTransactionWithSigners}
 * @see {@link assertIsTransactionMessageWithSingleSendingSigner}
 */
export function assertContainsResolvableTransactionSendingSigner(signers: readonly TransactionSigner[]) {
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
