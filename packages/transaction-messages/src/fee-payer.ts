import { Address } from '@solana/addresses';

import { BaseTransactionMessage } from './transaction-message';

/**
 * Represents a transaction message for which a fee payer has been declared. A transaction must
 * conform to this type to be compiled and landed on the network.
 */
export interface ITransactionMessageWithFeePayer<TAddress extends string = string> {
    readonly feePayer: Readonly<{ address: Address<TAddress> }>;
}

/**
 * Given a base58-encoded address of a system account, this method will return a new transaction
 * message having the same type as the one supplied plus the {@link ITransactionMessageWithFeePayer}
 * type.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import { setTransactionMessageFeePayer } from '@solana/transaction-messages';
 *
 * const myAddress = address('mpngsFd4tmbUfzDYJayjKZwZcaR7aWb2793J6grLsGu');
 * const txPaidByMe = setTransactionMessageFeePayer(myAddress, tx);
 * ```
 */
export function setTransactionMessageFeePayer<
    TFeePayerAddress extends string,
    TTransactionMessage extends BaseTransactionMessage & Partial<ITransactionMessageWithFeePayer>,
>(
    feePayer: Address<TFeePayerAddress>,
    transactionMessage: TTransactionMessage,
): ITransactionMessageWithFeePayer<TFeePayerAddress> & Omit<TTransactionMessage, 'feePayer'> {
    if (
        'feePayer' in transactionMessage &&
        feePayer === transactionMessage.feePayer?.address &&
        isAddressOnlyFeePayer(transactionMessage.feePayer)
    ) {
        return transactionMessage as unknown as ITransactionMessageWithFeePayer<TFeePayerAddress> &
            Omit<TTransactionMessage, 'feePayer'>;
    }
    const out = {
        ...transactionMessage,
        feePayer: Object.freeze({ address: feePayer }),
    };
    Object.freeze(out);
    return out;
}

function isAddressOnlyFeePayer(
    feePayer: Partial<ITransactionMessageWithFeePayer>['feePayer'],
): feePayer is { address: Address } {
    return (
        !!feePayer &&
        'address' in feePayer &&
        typeof feePayer.address === 'string' &&
        Object.keys(feePayer).length === 1
    );
}
