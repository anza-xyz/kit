import { BaseTransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';

import { TransactionSigner } from './transaction-signer';

/**
 * Alternative to {@link TransactionMessageWithFeePayer} that uses a {@link TransactionSigner} for the fee payer.
 *
 * @typeParam TAddress - Supply a string literal to define a fee payer having a particular address.
 * @typeParam TSigner - Optionally provide a narrower type for the {@link TransactionSigner}.
 *
 * @example
 * ```ts
 * import { BaseTransactionMessage } from '@solana/transaction-messages';
 * import { generateKeyPairSigner, TransactionMessageWithFeePayerSigner } from '@solana/signers';
 *
 * const transactionMessage: BaseTransactionMessage & TransactionMessageWithFeePayerSigner = {
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
 * Sets the fee payer of a {@link BaseTransactionMessage | transaction message}
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
    TTransactionMessage extends BaseTransactionMessage &
        Partial<TransactionMessageWithFeePayer | TransactionMessageWithFeePayerSigner>,
>(
    feePayer: TransactionSigner<TFeePayerAddress>,
    transactionMessage: TTransactionMessage,
): Omit<TTransactionMessage, 'feePayer'> & TransactionMessageWithFeePayerSigner<TFeePayerAddress> {
    Object.freeze(feePayer);
    const out = { ...transactionMessage, feePayer };
    Object.freeze(out);
    return out;
}
