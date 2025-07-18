import { Address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_MODIFYING_SIGNER, SolanaError } from '@solana/errors';
import { Transaction } from '@solana/transactions';

import { BaseTransactionSignerConfig } from './types';

/**
 * The configuration to optionally provide when calling the
 * {@link TransactionModifyingSigner#modifyAndSignTransactions | modifyAndSignTransactions} method.
 *
 * @see {@link BaseTransactionSignerConfig}
 */
export type TransactionModifyingSignerConfig = BaseTransactionSignerConfig;

/**
 * A signer interface that potentially modifies the provided {@link Transaction | Transactions}
 * before signing them.
 *
 * For instance, this enables wallets to inject additional instructions into the
 * transaction before signing them. For each transaction, instead of returning a
 * {@link SignatureDictionary}, its
 * {@link TransactionModifyingSigner#modifyAndSignTransactions | modifyAndSignTransactions} function
 * returns an updated {@link Transaction} with a potentially modified set of instructions and
 * signature dictionary.
 *
 * @typeParam TAddress - Supply a string literal to define a signer having a particular address.
 *
 * @example
 * ```ts
 * const signer: TransactionModifyingSigner<'1234..5678'> = {
 *     address: address('1234..5678'),
 *     modifyAndSignTransactions: async <T extends Transaction>(
 *         transactions: T[]
 *     ): Promise<T[]> => {
 *         // My custom signing logic.
 *     },
 * };
 * ```
 *
 * @remarks
 * Here are the main characteristics of this signer interface:
 *
 * - **Sequential**. Contrary to partial signers, these cannot be executed in
 *   parallel as each call can modify the provided transactions.
 * - **First signers**. For a given transaction, a modifying signer must always
 *   be used before a partial signer as the former will likely modify the
 *   transaction and thus impact the outcome of the latter.
 * - **Potential conflicts**. If more than one modifying signer is provided,
 *   the second signer may invalidate the signature of the first one. However,
 *   modifying signers may decide not to modify a transaction based on the
 *   existence of signatures for that transaction.
 *
 * @see {@link isTransactionModifyingSigner}
 * @see {@link assertIsTransactionModifyingSigner}
 */
export type TransactionModifyingSigner<TAddress extends string = string> = Readonly<{
    address: Address<TAddress>;
    modifyAndSignTransactions<T extends Transaction>(
        transactions: readonly T[],
        config?: TransactionModifyingSignerConfig,
    ): Promise<readonly T[]>;
}>;

/**
 * Checks whether the provided value implements the {@link TransactionModifyingSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { isTransactionModifyingSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * isTransactionModifyingSigner({ address, modifyAndSignTransactions: async () => {} }); // true
 * isTransactionModifyingSigner({ address }); // false
 * ```
 *
 * @see {@link assertIsTransactionModifyingSigner}
 */
export function isTransactionModifyingSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): value is TransactionModifyingSigner<TAddress> {
    return 'modifyAndSignTransactions' in value && typeof value.modifyAndSignTransactions === 'function';
}

/**
 * Asserts that the provided value implements the {@link TransactionModifyingSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { assertIsTransactionModifyingSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * assertIsTransactionModifyingSigner({ address, modifyAndSignTransactions: async () => {} }); // void
 * assertIsTransactionModifyingSigner({ address }); // Throws an error.
 * ```
 *
 * @see {@link isTransactionModifyingSigner}
 */
export function assertIsTransactionModifyingSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): asserts value is TransactionModifyingSigner<TAddress> {
    if (!isTransactionModifyingSigner(value)) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_MODIFYING_SIGNER, {
            address: value.address,
        });
    }
}
