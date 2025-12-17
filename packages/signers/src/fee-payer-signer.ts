import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';

import { TransactionSigner } from './transaction-signer';

/**
 * Alternative to {@link TransactionMessageWithFeePayer} that uses a {@link TransactionSigner} for the fee payer.
 *
 * @typeParam TAddress - Supply a string literal to define a fee payer having a particular address.
 * @typeParam TSigner - Optionally provide a narrower type for the {@link TransactionSigner}.
 *
 * @example
 * ```ts
 * import { TransactionMessage } from '@solana/transaction-messages';
 * import { generateKeyPairSigner, TransactionMessageWithFeePayerSigner } from '@solana/signers';
 *
 * const transactionMessage: TransactionMessage & TransactionMessageWithFeePayerSigner = {
 *     feePayer: await generateKeyPairSigner(),
 *     instructions: [],
 *     version: 0,
 * };
 * ```
 */
export interface TransactionMessageWithFeePayerSigner<
    TAddress extends string = string,
    TSigner extends TransactionSigner<TAddress> = TransactionSigner<TAddress>,
> {
    readonly feePayer: TSigner;
}

/**
 * A helper type to exclude the fee payer from a transaction message.
 */
type ExcludeTransactionMessageFeePayer<TTransactionMessage extends TransactionMessage> =
    TTransactionMessage extends unknown ? Omit<TTransactionMessage, 'feePayer'> : never;

/**
 * Sets the fee payer of a {@link TransactionMessage | transaction message}
 * using a {@link TransactionSigner}.
 *
 * @typeParam TFeePayerAddress - Supply a string literal to define a fee payer having a particular address.
 * @typeParam TTransactionMessage - The inferred type of the transaction message provided.
 *
 * @example
 * ```ts
 * import { pipe } from '@solana/functional';
 * import { generateKeyPairSigner, setTransactionMessageFeePayerSigner } from '@solana/signers';
 * import { createTransactionMessage } from '@solana/transaction-messages';
 *
 * const feePayer = await generateKeyPairSigner();
 * const transactionMessage = pipe(
 *     createTransactionMessage({ version: 0 }),
 *     message => setTransactionMessageFeePayerSigner(signer, message),
 * );
 * ```
 */
export function setTransactionMessageFeePayerSigner<
    TFeePayerAddress extends string,
    TTransactionMessage extends Partial<TransactionMessageWithFeePayer | TransactionMessageWithFeePayerSigner> &
        TransactionMessage,
>(
    feePayer: TransactionSigner<TFeePayerAddress>,
    transactionMessage: TTransactionMessage,
): ExcludeTransactionMessageFeePayer<TTransactionMessage> & TransactionMessageWithFeePayerSigner<TFeePayerAddress> {
    Object.freeze(feePayer);
    const out = { ...transactionMessage, feePayer };
    Object.freeze(out);
    return out as ExcludeTransactionMessageFeePayer<TTransactionMessage> &
        TransactionMessageWithFeePayerSigner<TFeePayerAddress>;
}
