import { Address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SIGNER, SolanaError } from '@solana/errors';

import { isTransactionModifyingSigner, TransactionModifyingSigner } from './transaction-modifying-signer';
import { isTransactionPartialSigner, TransactionPartialSigner } from './transaction-partial-signer';
import { isTransactionSendingSigner, TransactionSendingSigner } from './transaction-sending-signer';

/**
 * Defines a signer capable of signing transactions.
 *
 * @see {@link TransactionModifyingSigner} For signers that can modify transactions before signing them.
 * @see {@link TransactionPartialSigner} For signers that can be used in parallel.
 * @see {@link TransactionSendingSigner} For signers that send transactions after signing them.
 * @see {@link isTransactionSigner}
 * @see {@link assertIsTransactionSigner}
 */
export type TransactionSigner<TAddress extends string = string> =
    | TransactionModifyingSigner<TAddress>
    | TransactionPartialSigner<TAddress>
    | TransactionSendingSigner<TAddress>;

/**
 * Checks whether the provided value implements the {@link TransactionSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { isTransactionSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * isTransactionSigner({ address, signTransactions: async () => {} }); // true
 * isTransactionSigner({ address, modifyAndSignTransactions: async () => {} }); // true
 * isTransactionSigner({ address, signAndSendTransactions: async () => {} }); // true
 * isTransactionSigner({ address }); // false
 * ```
 *
 * @see {@link assertIsTransactionSigner}
 */
export function isTransactionSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): value is TransactionSigner<TAddress> {
    return (
        isTransactionPartialSigner(value) || isTransactionModifyingSigner(value) || isTransactionSendingSigner(value)
    );
}

/**
 * Asserts that the provided value implements the {@link TransactionSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { assertIsTransactionSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * assertIsTransactionSigner({ address, signTransactions: async () => {} }); // void
 * assertIsTransactionSigner({ address, modifyAndSignTransactions: async () => {} }); // void
 * assertIsTransactionSigner({ address, signAndSendTransactions: async () => {} }); // void
 * assertIsTransactionSigner({ address }); // Throws an error.
 * ```
 *
 * @see {@link isTransactionSigner}
 */
export function assertIsTransactionSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): asserts value is TransactionSigner<TAddress> {
    if (!isTransactionSigner(value)) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SIGNER, {
            address: value.address,
        });
    }
}
