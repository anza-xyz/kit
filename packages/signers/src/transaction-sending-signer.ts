import { Address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SENDING_SIGNER, SolanaError } from '@solana/errors';
import { SignatureBytes } from '@solana/keys';
import { Transaction } from '@solana/transactions';

import { BaseTransactionSignerConfig } from './types';

/**
 * The configuration to optionally provide when calling the
 * {@link TransactionSendingSignerConfig#signAndSendTransactions | signAndSendTransactions} method.
 *
 * @see {@link BaseTransactionSignerConfig}
 */
export type TransactionSendingSignerConfig = BaseTransactionSignerConfig;

/**
 * A signer interface that signs one or multiple transactions
 * before sending them immediately to the blockchain.
 *
 * It defines a {@link TransactionSendingSignerConfig#signAndSendTransactions | signAndSendTransactions}
 * function that returns the transaction signature (i.e. its identifier) for each provided
 * {@link Transaction}.
 *
 * This interface is required for PDA wallets and other types of wallets that don't provide an
 * interface for signing transactions without sending them.
 *
 * Note that it is also possible for such signers to modify the provided transactions
 * before signing and sending them. This enables use cases where the modified transactions
 * cannot be shared with the app and thus must be sent directly.
 *
 * @typeParam TAddress - Supply a string literal to define a signer having a particular address.
 *
 * @example
 * ```ts
 * const myTransactionSendingSigner: TransactionSendingSigner<'1234..5678'> = {
 *     address: address('1234..5678'),
 *     signAndSendTransactions: async (transactions: Transaction[]): Promise<SignatureBytes[]> => {
 *         // My custom signing logic.
 *     },
 * };
 * ```
 *
 * @remarks
 * Here are the main characteristics of this signer interface:
 *
 * - **Single signer**. Since this signer also sends the provided transactions,
 *   we can only use a single {@link TransactionSendingSigner} for a given set of transactions.
 * - **Last signer**. Trivially, that signer must also be the last one used.
 * - **Potential conflicts**. Since signers may decide to modify the given
 *   transactions before sending them, they may invalidate previous signatures.
 *   However, signers may decide not to modify a transaction based
 *   on the existence of signatures for that transaction.
 * - **Potential confirmation**. Whilst this is not required by this interface,
 *   it is also worth noting that most wallets will also wait for the transaction
 *   to be confirmed (typically with a `confirmed` commitment)
 *   before notifying the app that they are done.
 *
 * @see {@link isTransactionSendingSigner}
 * @see {@link assertIsTransactionSendingSigner}
 */
export type TransactionSendingSigner<TAddress extends string = string> = Readonly<{
    address: Address<TAddress>;
    signAndSendTransactions(
        transactions: readonly Transaction[],
        config?: TransactionSendingSignerConfig,
    ): Promise<readonly SignatureBytes[]>;
}>;

/**
 * Checks whether the provided value implements the {@link TransactionSendingSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { isTransactionSendingSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * isTransactionSendingSigner({ address, signAndSendTransactions: async () => {} }); // true
 * isTransactionSendingSigner({ address }); // false
 * ```
 *
 * @see {@link assertIsTransactionSendingSigner}
 */
export function isTransactionSendingSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): value is TransactionSendingSigner<TAddress> {
    return 'signAndSendTransactions' in value && typeof value.signAndSendTransactions === 'function';
}

/**
 * Asserts that the provided value implements the {@link TransactionSendingSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { assertIsTransactionSendingSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * assertIsTransactionSendingSigner({ address, signAndSendTransactions: async () => {} }); // void
 * assertIsTransactionSendingSigner({ address }); // Throws an error.
 * ```
 *
 * @see {@link isTransactionSendingSigner}
 */
export function assertIsTransactionSendingSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): asserts value is TransactionSendingSigner<TAddress> {
    if (!isTransactionSendingSigner(value)) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SENDING_SIGNER, {
            address: value.address,
        });
    }
}
