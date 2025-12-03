import { Signature } from '@solana/keys';
import {
    getSignatureFromTransaction,
    Transaction,
    TransactionWithBlockhashLifetime,
    TransactionWithDurableNonceLifetime,
} from '@solana/transactions';

import { createBlockHeightExceedencePromiseFactory } from './confirmation-strategy-blockheight';
import { createNonceInvalidationPromiseFactory } from './confirmation-strategy-nonce';
import { BaseTransactionConfirmationStrategyConfig, raceStrategies } from './confirmation-strategy-racer';
import { getTimeoutPromise } from './confirmation-strategy-timeout';

export type TransactionWithLastValidBlockHeight = Omit<TransactionWithBlockhashLifetime, 'lifetimeConstraint'> & {
    lifetimeConstraint: Omit<TransactionWithBlockhashLifetime['lifetimeConstraint'], 'blockhash'>;
};

interface WaitForDurableNonceTransactionConfirmationConfig extends BaseTransactionConfirmationStrategyConfig {
    getNonceInvalidationPromise: ReturnType<typeof createNonceInvalidationPromiseFactory>;
    transaction: Readonly<Transaction & TransactionWithDurableNonceLifetime>;
}

interface WaitForRecentTransactionWithBlockhashLifetimeConfirmationConfig
    extends BaseTransactionConfirmationStrategyConfig {
    getBlockHeightExceedencePromise: ReturnType<typeof createBlockHeightExceedencePromiseFactory>;
    transaction: Readonly<Transaction & TransactionWithLastValidBlockHeight>;
}

interface WaitForRecentTransactionWithTimeBasedLifetimeConfirmationConfig
    extends BaseTransactionConfirmationStrategyConfig {
    getTimeoutPromise: typeof getTimeoutPromise;
    /**
     * A 64 byte Ed25519 signature, encoded as a base-58 string, that uniquely identifies a
     * transaction by virtue of being the first or only signature in its list of signatures.
     */
    signature: Signature;
}

/**
 * Supply your own confirmation implementations to this function to create a custom nonce
 * transaction confirmation strategy.
 *
 * @example
 * ```ts
 * import { waitForDurableNonceTransactionConfirmation } from '@solana/transaction-confirmation';
 *
 * try {
 *     await waitForDurableNonceTransactionConfirmation({
 *         getNonceInvalidationPromise({ abortSignal, commitment, currentNonceValue, nonceAccountAddress }) {
 *             // Return a promise that rejects when a nonce becomes invalid.
 *         },
 *         getRecentSignatureConfirmationPromise({ abortSignal, commitment, signature }) {
 *             // Return a promise that resolves when a transaction achieves confirmation
 *         },
 *     });
 * } catch (e) {
 *     // Handle errors.
 * }
 * ```
 */
export async function waitForDurableNonceTransactionConfirmation(
    config: WaitForDurableNonceTransactionConfirmationConfig,
): Promise<void> {
    await raceStrategies(
        getSignatureFromTransaction(config.transaction),
        config,
        function getSpecificStrategiesForRace({ abortSignal, commitment, getNonceInvalidationPromise, transaction }) {
            return [
                getNonceInvalidationPromise({
                    abortSignal,
                    commitment,
                    currentNonceValue: transaction.lifetimeConstraint.nonce,
                    nonceAccountAddress: transaction.lifetimeConstraint.nonceAccountAddress,
                }),
            ];
        },
    );
}

/**
 * Supply your own confirmation implementations to this function to create a custom confirmation
 * strategy for recently-landed transactions.
 *
 * @example
 * ```ts
 * import { waitForRecentTransactionConfirmation } from '@solana/transaction-confirmation';
 *
 * try {
 *     await waitForRecentTransactionConfirmation({
 *         getBlockHeightExceedencePromise({ abortSignal, commitment, lastValidBlockHeight }) {
 *             // Return a promise that rejects when the blockhash's block height has been exceeded
 *         },
 *         getRecentSignatureConfirmationPromise({ abortSignal, commitment, signature }) {
 *             // Return a promise that resolves when a transaction achieves confirmation
 *         },
 *     });
 * } catch (e) {
 *     // Handle errors.
 * }
 * ```
 */
export async function waitForRecentTransactionConfirmation(
    config: WaitForRecentTransactionWithBlockhashLifetimeConfirmationConfig,
): Promise<void> {
    await raceStrategies(
        getSignatureFromTransaction(config.transaction),
        config,
        function getSpecificStrategiesForRace({
            abortSignal,
            commitment,
            getBlockHeightExceedencePromise,
            transaction,
        }) {
            return [
                getBlockHeightExceedencePromise({
                    abortSignal,
                    commitment,
                    lastValidBlockHeight: transaction.lifetimeConstraint.lastValidBlockHeight,
                }),
            ];
        },
    );
}

/** @deprecated */
export async function waitForRecentTransactionConfirmationUntilTimeout(
    config: WaitForRecentTransactionWithTimeBasedLifetimeConfirmationConfig,
): Promise<void> {
    await raceStrategies(
        config.signature,
        config,
        function getSpecificStrategiesForRace({ abortSignal, commitment, getTimeoutPromise }) {
            return [
                getTimeoutPromise({
                    abortSignal,
                    commitment,
                }),
            ];
        },
    );
}
