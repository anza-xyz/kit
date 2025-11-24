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
 * @typeParam TSigner - The type of the fee payer signer.
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
    TSigner extends TransactionSigner<TFeePayerAddress> = TransactionSigner<TFeePayerAddress>,
>(
    feePayer: TSigner,
    transactionMessage: TTransactionMessage,
): Omit<TTransactionMessage, 'feePayer'> & TransactionMessageWithFeePayerSigner<TFeePayerAddress, TSigner> {
    Object.freeze(feePayer);
    const out = { ...transactionMessage, feePayer };
    Object.freeze(out);
    return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KeysOfUnion<T> = T extends any ? keyof T : never;
type SignerKeysToExclude = Exclude<KeysOfUnion<TransactionSigner>, 'address'>;
type NonSigner<T> = T & {
    [K in SignerKeysToExclude]?: never;
};

/**
 * A transaction message fee payer that is not a signer.
 */
export type NonSignerFeePayer<TAddress extends string = string> = NonSigner<
    TransactionMessageWithFeePayer<TAddress>['feePayer']
>;
