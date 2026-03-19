import { SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING, SolanaError } from '@solana/errors';
import { SignatureBytes } from '@solana/keys';
import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
import {
    assertIsFullySignedTransaction,
    compileTransaction,
    SendableTransaction,
    Transaction,
    TransactionWithinSizeLimit,
    TransactionWithLifetime,
} from '@solana/transactions';

import { getSignersFromTransactionMessage, TransactionMessageWithSigners } from './account-signer-meta';
import { deduplicateSigners } from './deduplicate-signers';
import {
    isTransactionModifyingSigner,
    TransactionModifyingSigner,
    TransactionModifyingSignerConfig,
} from './transaction-modifying-signer';
import {
    isTransactionPartialSigner,
    TransactionPartialSigner,
    TransactionPartialSignerConfig,
} from './transaction-partial-signer';
import {
    isTransactionSendingSigner,
    TransactionSendingSigner,
    TransactionSendingSignerConfig,
} from './transaction-sending-signer';
import { isTransactionSigner, TransactionSigner } from './transaction-signer';
import { assertContainsResolvableTransactionSendingSigner } from './transaction-with-single-sending-signer';

/**
 * Extracts all {@link TransactionSigner | TransactionSigners} inside the provided
 * transaction message and uses them to return a signed transaction.
 *
 * It first uses all {@link TransactionModifyingSigner | TransactionModifyingSigners} sequentially before
 * using all {@link TransactionPartialSigner | TransactionPartialSigners} in parallel.
 *
 * If a composite signer implements both interfaces, it will be used as a
 * {@link TransactionModifyingSigner} if no other signer implements that interface.
 * Otherwise, it will be used as a {@link TransactionPartialSigner}.
 *
 * @example
 * ```ts
 * const signedTransaction = await partiallySignTransactionMessageWithSigners(transactionMessage);
 * ```
 *
 * It also accepts an optional {@link AbortSignal} that will be propagated to all signers.
 *
 * ```ts
 * const signedTransaction = await partiallySignTransactionMessageWithSigners(transactionMessage, {
 *     abortSignal: myAbortController.signal,
 * });
 * ```
 *
 * @remarks
 * Finally, note that this function ignores {@link TransactionSendingSigner | TransactionSendingSigners}
 * as it does not send the transaction. Check out the {@link signAndSendTransactionMessageWithSigners}
 * function for more details on how to use sending signers.
 *
 * @see {@link partiallySignTransactionWithSigners}
 * @see {@link signTransactionMessageWithSigners}
 * @see {@link signAndSendTransactionMessageWithSigners}
 */
export async function partiallySignTransactionMessageWithSigners(
    transactionMessage: TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithSigners,
    config?: TransactionPartialSignerConfig,
): Promise<Transaction & TransactionWithinSizeLimit & TransactionWithLifetime> {
    return await partiallySignTransactionWithSigners(
        getSignersFromTransactionMessage(transactionMessage).filter(
            signer => isTransactionModifyingSigner(signer) || isTransactionPartialSigner(signer),
        ),
        compileTransaction(transactionMessage),
        config,
    );
}

/**
 * Extracts all {@link TransactionSigner | TransactionSigners} inside the provided
 * transaction message and uses them to return a signed transaction before asserting
 * that all signatures required by the transaction are present.
 *
 * This function delegates to the {@link partiallySignTransactionMessageWithSigners} function
 * in order to extract signers from the transaction message and sign the transaction.
 *
 * @example
 * ```ts
 * const mySignedTransaction = await signTransactionMessageWithSigners(myTransactionMessage);
 *
 * // With additional config.
 * const mySignedTransaction = await signTransactionMessageWithSigners(myTransactionMessage, {
 *     abortSignal: myAbortController.signal,
 * });
 *
 * // We now know the transaction is fully signed.
 * mySignedTransaction satisfies FullySignedTransaction;
 * ```
 *
 * @see {@link signTransactionWithSigners}
 * @see {@link partiallySignTransactionMessageWithSigners}
 * @see {@link signAndSendTransactionMessageWithSigners}
 */
export async function signTransactionMessageWithSigners(
    transactionMessage: TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithSigners,
    config?: TransactionPartialSignerConfig,
): Promise<SendableTransaction & Transaction & TransactionWithLifetime> {
    const signedTransaction = await partiallySignTransactionMessageWithSigners(transactionMessage, config);
    assertIsFullySignedTransaction(signedTransaction);
    return signedTransaction;
}

/**
 * Extracts all {@link TransactionSigner | TransactionSigners} inside the provided
 * transaction message and uses them to sign it before sending it immediately to the blockchain.
 *
 * It returns the signature of the sent transaction (i.e. its identifier) as bytes.
 *
 * @example
 * ```ts
 * import { signAndSendTransactionMessageWithSigners } from '@solana/signers';
 *
 * const transactionSignature = await signAndSendTransactionMessageWithSigners(transactionMessage);
 *
 * // With additional config.
 * const transactionSignature = await signAndSendTransactionMessageWithSigners(transactionMessage, {
 *     abortSignal: myAbortController.signal,
 * });
 * ```
 *
 * @remarks
 * Similarly to the {@link partiallySignTransactionMessageWithSigners} function, it first uses all
 * {@link TransactionModifyingSigner | TransactionModifyingSigners} sequentially before using all
 * {@link TransactionPartialSigner | TransactionPartialSigners} in parallel.
 * It then sends the transaction using the {@link TransactionSendingSigner} it identified.
 *
 * Composite transaction signers are treated such that at least one sending signer is used if any.
 * When a {@link TransactionSigner} implements more than one interface, we use it as a:
 *
 * - {@link TransactionSendingSigner}, if no other {@link TransactionSendingSigner} exists.
 * - {@link TransactionModifyingSigner}, if no other {@link TransactionModifyingSigner} exists.
 * - {@link TransactionPartialSigner}, otherwise.
 *
 * The provided transaction must contain exactly one {@link TransactionSendingSigner} inside its account metas.
 * If more than one composite signers implement the {@link TransactionSendingSigner} interface,
 * one of them will be selected as the sending signer. Otherwise, if multiple
 * {@link TransactionSendingSigner | TransactionSendingSigners} must be selected, the function will throw an error.
 *
 * If you'd like to assert that a transaction makes use of exactly one {@link TransactionSendingSigner}
 * _before_ calling this function, you may use the {@link assertIsTransactionMessageWithSingleSendingSigner} function.
 *
 * Alternatively, you may use the {@link isTransactionMessageWithSingleSendingSigner} function to provide a
 * fallback in case the transaction does not contain any sending signer.
 *
 * @see {@link signAndSendTransactionWithSigners}
 * @see {@link assertIsTransactionMessageWithSingleSendingSigner}
 * @see {@link isTransactionMessageWithSingleSendingSigner}
 * @see {@link partiallySignTransactionMessageWithSigners}
 * @see {@link signTransactionMessageWithSigners}
 *
 */
export async function signAndSendTransactionMessageWithSigners(
    transaction: TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithSigners,
    config?: TransactionSendingSignerConfig,
): Promise<SignatureBytes> {
    return await signAndSendTransactionWithSigners(
        getSignersFromTransactionMessage(transaction).filter(isTransactionSigner),
        compileTransaction(transaction),
        config,
    );
}

/**
 * Signs a transaction using the provided {@link TransactionModifyingSigner | TransactionModifyingSigners}
 * and {@link TransactionPartialSigner | TransactionPartialSigners}.
 *
 * It first uses all {@link TransactionModifyingSigner | TransactionModifyingSigners} sequentially before
 * using all {@link TransactionPartialSigner | TransactionPartialSigners} in parallel.
 *
 * If a composite signer implements both interfaces, it will be used as a
 * {@link TransactionModifyingSigner} if no other signer implements that interface.
 * Otherwise, it will be used as a {@link TransactionPartialSigner}.
 *
 * @param signers - The signers to use. Only {@link TransactionModifyingSigner} and
 * {@link TransactionPartialSigner} interfaces are accepted.
 * @param transaction - The compiled transaction to sign.
 * @param config - Optional configuration including an {@link AbortSignal}.
 * @returns The signed transaction.
 *
 * @example
 * ```ts
 * const signedTransaction = await partiallySignTransactionWithSigners(mySigners, compiledTransaction);
 * ```
 *
 * It also accepts an optional {@link AbortSignal} that will be propagated to all signers.
 *
 * ```ts
 * const signedTransaction = await partiallySignTransactionWithSigners(mySigners, compiledTransaction, {
 *     abortSignal: myAbortController.signal,
 * });
 * ```
 *
 * @see {@link signTransactionWithSigners}
 * @see {@link signAndSendTransactionWithSigners}
 * @see {@link partiallySignTransactionMessageWithSigners}
 */
export async function partiallySignTransactionWithSigners(
    signers: readonly (TransactionModifyingSigner | TransactionPartialSigner)[],
    transaction: Transaction,
    config?: TransactionPartialSignerConfig,
): Promise<Transaction & TransactionWithinSizeLimit & TransactionWithLifetime> {
    const { partialSigners, modifyingSigners } = categorizeTransactionSigners(deduplicateSigners(signers), {
        identifySendingSigner: false,
    });

    return await signModifyingAndPartialTransactionSigners(transaction, modifyingSigners, partialSigners, config);
}

/**
 * Signs a transaction using the provided signers and asserts that all
 * signatures required by the transaction are present.
 *
 * This function delegates to {@link partiallySignTransactionWithSigners} to sign
 * the transaction, then asserts it is fully signed before returning.
 *
 * @param signers - The signers to use. Only {@link TransactionModifyingSigner} and
 * {@link TransactionPartialSigner} interfaces are accepted.
 * @param transaction - The compiled transaction to sign.
 * @param config - Optional configuration including an {@link AbortSignal}.
 * @returns The fully signed transaction.
 *
 * @example
 * ```ts
 * const mySignedTransaction = await signTransactionWithSigners(mySigners, compiledTransaction);
 *
 * // With additional config.
 * const mySignedTransaction = await signTransactionWithSigners(mySigners, compiledTransaction, {
 *     abortSignal: myAbortController.signal,
 * });
 *
 * // We now know the transaction is fully signed.
 * mySignedTransaction satisfies FullySignedTransaction;
 * ```
 *
 * @see {@link partiallySignTransactionWithSigners}
 * @see {@link signAndSendTransactionWithSigners}
 * @see {@link signTransactionMessageWithSigners}
 */
export async function signTransactionWithSigners(
    signers: readonly (TransactionModifyingSigner | TransactionPartialSigner)[],
    transaction: Transaction,
    config?: TransactionPartialSignerConfig,
): Promise<SendableTransaction & Transaction & TransactionWithLifetime> {
    const signedTransaction = await partiallySignTransactionWithSigners(signers, transaction, config);
    assertIsFullySignedTransaction(signedTransaction);
    return signedTransaction;
}

/**
 * Signs a transaction using the provided signers and sends it immediately to the blockchain.
 *
 * It returns the signature of the sent transaction (i.e. its identifier) as bytes.
 *
 * Similarly to {@link partiallySignTransactionWithSigners}, it first uses all
 * {@link TransactionModifyingSigner | TransactionModifyingSigners} sequentially before using all
 * {@link TransactionPartialSigner | TransactionPartialSigners} in parallel.
 * It then sends the transaction using the {@link TransactionSendingSigner} it identified.
 *
 * Composite transaction signers are treated such that at least one sending signer is used if any.
 * When a {@link TransactionSigner} implements more than one interface, we use it as a:
 *
 * - {@link TransactionSendingSigner}, if no other {@link TransactionSendingSigner} exists.
 * - {@link TransactionModifyingSigner}, if no other {@link TransactionModifyingSigner} exists.
 * - {@link TransactionPartialSigner}, otherwise.
 *
 * The provided signers must contain exactly one {@link TransactionSendingSigner} that can be
 * unambiguously resolved. If more than one composite signers implement the
 * {@link TransactionSendingSigner} interface, one of them will be selected as the sending signer.
 * Otherwise, if multiple {@link TransactionSendingSigner | TransactionSendingSigners} must be
 * selected, the function will throw an error.
 *
 * @param signers - The signers to use. Must contain at least one resolvable
 * {@link TransactionSendingSigner}.
 * @param transaction - The compiled transaction to sign and send.
 * @param config - Optional configuration including an {@link AbortSignal}.
 * @returns The signature of the sent transaction as bytes.
 *
 * @example
 * ```ts
 * const transactionSignature = await signAndSendTransactionWithSigners(mySigners, compiledTransaction);
 *
 * // With additional config.
 * const transactionSignature = await signAndSendTransactionWithSigners(mySigners, compiledTransaction, {
 *     abortSignal: myAbortController.signal,
 * });
 * ```
 *
 * @see {@link assertContainsResolvableTransactionSendingSigner}
 * @see {@link partiallySignTransactionWithSigners}
 * @see {@link signTransactionWithSigners}
 * @see {@link signAndSendTransactionMessageWithSigners}
 */
export async function signAndSendTransactionWithSigners(
    signers: readonly TransactionSigner[],
    transaction: Transaction,
    config?: TransactionSendingSignerConfig,
): Promise<SignatureBytes> {
    assertContainsResolvableTransactionSendingSigner(signers);

    const abortSignal = config?.abortSignal;
    const { partialSigners, modifyingSigners, sendingSigner } = categorizeTransactionSigners(
        deduplicateSigners(signers),
    );

    abortSignal?.throwIfAborted();
    const signedTransaction = await signModifyingAndPartialTransactionSigners(
        transaction,
        modifyingSigners,
        partialSigners,
        config,
    );

    if (!sendingSigner) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING);
    }

    abortSignal?.throwIfAborted();
    const [signature] = await sendingSigner.signAndSendTransactions([signedTransaction], config);
    abortSignal?.throwIfAborted();

    return signature;
}

/**
 * Identifies each provided TransactionSigner and categorizes them into their respective types.
 * When a signer implements multiple interface, it will try to used to most powerful interface
 * but fallback to the least powerful interface when necessary.
 * For instance, if a signer implements TransactionSendingSigner and TransactionModifyingSigner,
 * it will be categorized as a TransactionSendingSigner if and only if no other signers implement
 * the TransactionSendingSigner interface.
 */
function categorizeTransactionSigners(
    signers: readonly TransactionSigner[],
    config: { identifySendingSigner?: boolean } = {},
): Readonly<{
    modifyingSigners: readonly TransactionModifyingSigner[];
    partialSigners: readonly TransactionPartialSigner[];
    sendingSigner: TransactionSendingSigner | null;
}> {
    // Identify the unique sending signer that should be used.
    const identifySendingSigner = config.identifySendingSigner ?? true;
    const sendingSigner = identifySendingSigner ? identifyTransactionSendingSigner(signers) : null;

    // Now, focus on the other signers.
    // I.e. the modifying or partial signers that are not the identified sending signer.
    // Note that any other sending only signers will be discarded.
    const otherSigners = signers.filter(
        (signer): signer is TransactionModifyingSigner | TransactionPartialSigner =>
            signer !== sendingSigner && (isTransactionModifyingSigner(signer) || isTransactionPartialSigner(signer)),
    );

    // Identify the modifying signers from the other signers.
    const modifyingSigners = identifyTransactionModifyingSigners(otherSigners);

    // Use any remaining signers as partial signers.
    const partialSigners = otherSigners
        .filter(isTransactionPartialSigner)
        .filter(signer => !(modifyingSigners as typeof otherSigners).includes(signer));

    return Object.freeze({ modifyingSigners, partialSigners, sendingSigner });
}

/** Identifies the best signer to use as a TransactionSendingSigner, if any */
function identifyTransactionSendingSigner(signers: readonly TransactionSigner[]): TransactionSendingSigner | null {
    // Ensure there are any TransactionSendingSigners in the first place.
    const sendingSigners = signers.filter(isTransactionSendingSigner);
    if (sendingSigners.length === 0) return null;

    // Prefer sending signers that do not offer other interfaces.
    const sendingOnlySigners = sendingSigners.filter(
        signer => !isTransactionModifyingSigner(signer) && !isTransactionPartialSigner(signer),
    );
    if (sendingOnlySigners.length > 0) {
        return sendingOnlySigners[0];
    }

    // Otherwise, choose any sending signer.
    return sendingSigners[0];
}

/** Identifies the best signers to use as TransactionModifyingSigners, if any */
function identifyTransactionModifyingSigners(
    signers: readonly (TransactionModifyingSigner | TransactionPartialSigner)[],
): readonly TransactionModifyingSigner[] {
    // Ensure there are any TransactionModifyingSigner in the first place.
    const modifyingSigners = signers.filter(isTransactionModifyingSigner);
    if (modifyingSigners.length === 0) return [];

    // Prefer modifying signers that do not offer partial signing.
    const nonPartialSigners = modifyingSigners.filter(signer => !isTransactionPartialSigner(signer));
    if (nonPartialSigners.length > 0) return nonPartialSigners;

    // Otherwise, choose only one modifying signer (whichever).
    return [modifyingSigners[0]];
}

/**
 * Signs a transaction using the provided TransactionModifyingSigners
 * sequentially followed by the TransactionPartialSigners in parallel.
 */
async function signModifyingAndPartialTransactionSigners(
    transaction: Transaction,
    modifyingSigners: readonly TransactionModifyingSigner[] = [],
    partialSigners: readonly TransactionPartialSigner[] = [],
    config?: TransactionModifyingSignerConfig,
): Promise<Transaction & TransactionWithinSizeLimit & TransactionWithLifetime> {
    // Handle modifying signers sequentially.
    const modifiedTransaction = (await modifyingSigners.reduce(
        async (transaction, modifyingSigner) => {
            config?.abortSignal?.throwIfAborted();
            const [tx] = await modifyingSigner.modifyAndSignTransactions([await transaction], config);
            return Object.freeze(tx);
        },
        Promise.resolve(transaction) as Promise<Readonly<Transaction & TransactionWithLifetime>>,
    )) as Transaction & TransactionWithinSizeLimit & TransactionWithLifetime;

    // Handle partial signers in parallel.
    config?.abortSignal?.throwIfAborted();
    const signatureDictionaries = await Promise.all(
        partialSigners.map(async partialSigner => {
            const [signatures] = await partialSigner.signTransactions([modifiedTransaction], config);
            return signatures;
        }),
    );

    return Object.freeze({
        ...modifiedTransaction,
        signatures: Object.freeze(
            signatureDictionaries.reduce((signatures, signatureDictionary) => {
                return { ...signatures, ...signatureDictionary };
            }, modifiedTransaction.signatures ?? {}),
        ),
    });
}
