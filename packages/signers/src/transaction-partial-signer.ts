import { Address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_PARTIAL_SIGNER, SolanaError } from '@solana/errors';
import { Transaction, TransactionWithinSizeLimit, TransactionWithLifetime } from '@solana/transactions';

import { BaseTransactionSignerConfig, SignatureDictionary } from './types';

/**
 * The configuration to optionally provide when calling the
 * {@link TransactionPartialSigner#signTransactions | signTransactions} method.
 *
 * @see {@link BaseTransactionSignerConfig}
 */
export type TransactionPartialSignerConfig = BaseTransactionSignerConfig;

/**
 * A signer interface that signs an array of {@link Transaction | Transactions}
 *  without modifying their content. It defines a
 * {@link TransactionPartialSigner#signTransactions | signTransactions}
 * function that returns a {@link SignatureDictionary} for each provided transaction.
 *
 * Such signature dictionaries are expected to be merged with the existing ones if any.
 *
 * @typeParam TAddress - Supply a string literal to define a signer having a particular address.
 *
 * @example
 * ```ts
 * const signer: TransactionPartialSigner<'1234..5678'> = {
 *     address: address('1234..5678'),
 *     signTransactions: async (
 *         transactions: Transaction[]
 *     ): Promise<SignatureDictionary[]> => {
 *         // My custom signing logic.
 *     },
 * };
 * ```
 *
 * @remarks
 * Here are the main characteristics of this signer interface:
 *
 * - **Parallel**. It returns a signature dictionary for each provided
 *   transaction without modifying them, making it possible for multiple
 *   partial signers to sign the same transaction in parallel.
 * - **Flexible order**. The order in which we use these signers for
 *   a given transaction doesn’t matter.
 *
 * @see {@link isTransactionPartialSigner}
 * @see {@link assertIsTransactionPartialSigner}
 */
export type TransactionPartialSigner<TAddress extends string = string> = Readonly<{
    address: Address<TAddress>;
    signTransactions(
        transactions: readonly (Transaction & TransactionWithinSizeLimit & TransactionWithLifetime)[],
        config?: TransactionPartialSignerConfig,
    ): Promise<readonly SignatureDictionary[]>;
}>;

/**
 * Checks whether the provided value implements the {@link TransactionPartialSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { isTransactionPartialSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * isTransactionPartialSigner({ address, signTransactions: async () => {} }); // true
 * isTransactionPartialSigner({ address }); // false
 * ```
 *
 * @see {@link assertIsTransactionPartialSigner}
 */
export function isTransactionPartialSigner<TAddress extends string, TValue extends { address: Address<TAddress> }>(
    value: TValue,
): value is TransactionPartialSigner<TAddress> & TValue {
    return 'signTransactions' in value && typeof value.signTransactions === 'function';
}

/**
 * Asserts that the provided value implements the {@link TransactionPartialSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { assertIsTransactionPartialSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * assertIsTransactionPartialSigner({ address, signTransactions: async () => {} }); // void
 * assertIsTransactionPartialSigner({ address }); // Throws an error.
 * ```
 *
 * @see {@link isTransactionPartialSigner}
 */
export function assertIsTransactionPartialSigner<
    TAddress extends string,
    TValue extends { address: Address<TAddress> },
>(value: TValue): asserts value is TransactionPartialSigner<TAddress> & TValue {
    if (!isTransactionPartialSigner(value)) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_PARTIAL_SIGNER, {
            address: value.address,
        });
    }
}
