import type { Address } from '@solana/addresses';

/**
 * Represents a transaction message for which a fee payer has been declared. A transaction must
 * conform to this type to be compiled and landed on the network.
 *
 * @deprecated Use {@link TransactionMessageWithFeePayer} instead. It was only renamed.
 */
export interface ITransactionMessageWithFeePayer<TAddress extends string = string> {
    readonly feePayer: Readonly<{ address: Address<TAddress> }>;
}
