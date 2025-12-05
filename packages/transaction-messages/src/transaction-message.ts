import {
    SOLANA_ERROR__TRANSACTION__EXPECTED_LEGACY_TRANSACTION_MESSAGE,
    SOLANA_ERROR__TRANSACTION__EXPECTED_V0_TRANSACTION_MESSAGE,
    SolanaError,
} from '@solana/errors';
import { AccountMeta, Instruction } from '@solana/instructions';

export type BaseTransactionMessage<
    TVersion extends TransactionVersion = TransactionVersion,
    TInstruction extends Instruction = Instruction,
> = Readonly<{
    instructions: readonly TInstruction[];
    version: TVersion;
}>;

export const MAX_SUPPORTED_TRANSACTION_VERSION = 0;

type LegacyInstruction<TProgramAddress extends string = string> = Instruction<TProgramAddress, readonly AccountMeta[]>;
type LegacyTransactionMessage = BaseTransactionMessage<'legacy', LegacyInstruction>;
type V0TransactionMessage = BaseTransactionMessage<0, Instruction>;

export type TransactionMessage = LegacyTransactionMessage | V0TransactionMessage;
export type TransactionVersion = 'legacy' | 0;

/**
 * A type guard that returns `true` if the transaction message is a
 * {@link LegacyTransactionMessage} type, and refines its type for use in your
 * program.
 *
 * @example
 * ```ts
 * import { isLegacyTransactionMessage } from '@solana/transaction-messages';
 *
 * if (isLegacyTransactionMessage(message)) {
 *     // At this point, `message` has been refined to a `LegacyTransactionMessage`.
 *     const version = message.version; // 'legacy'
 * } else {
 *     setError(
 *         `${getSignatureFromTransaction(transaction)} is not a legacy transaction message`,
 *     );
 * }
 * ```
 */
export function isLegacyTransactionMessage(
    transactionMessage: LegacyTransactionMessage | V0TransactionMessage,
): transactionMessage is LegacyTransactionMessage {
    return (
        'version' in transactionMessage &&
        typeof transactionMessage.version === 'string' &&
        transactionMessage.version === 'legacy'
    );
}

/**
 * Use this function to assert that a transaction message is a `legacy` version
 *
 *
 * @example
 * ```ts
 * import { assertIsLegacyTransactionMessage } from '@solana/transaction-messages';
 *
 * try {
 *     // If this type assertion function doesn't throw, then
 *     // Typescript will upcast `message` to `LegacyTransactionMessage`.
 *     assertIsLegacyTransactionMessage(message);
 *     // At this point, `message` is a `LegacyTransactionMessage` that can be used
 *     // as required.
 *     const version = message.version // 'legacy'
 * } catch (e) {
 *     // `message` turned out not to not be a legacy transaction message
 * }
 * ```
 */
export function assertIsLegacyTransactionMessage(
    transactionMessage: LegacyTransactionMessage | V0TransactionMessage,
): asserts transactionMessage is LegacyTransactionMessage {
    if (!isLegacyTransactionMessage(transactionMessage)) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXPECTED_LEGACY_TRANSACTION_MESSAGE);
    }
}

/**
 * A type guard that returns `true` if the transaction message is a
 * {@link V0TransactionMessage} type, and refines its type for use in your
 * program.
 *
 * @example
 * ```ts
 * import { isV0TransactionMessage } from '@solana/transaction-messages';
 *
 * if (isV0TransactionMessage(message)) {
 *     // At this point, `message` has been refined to a `V0TransactionMessage`.
 *     const version = message.version; // 0
 * } else {
 *     setError(
 *         `${getSignatureFromTransaction(transaction)} is not a v0 transaction message`,
 *     );
 * }
 * ```
 */
export function isV0TransactionMessage(
    transactionMessage: LegacyTransactionMessage | V0TransactionMessage,
): transactionMessage is V0TransactionMessage {
    return (
        'version' in transactionMessage &&
        typeof transactionMessage.version === 'number' &&
        transactionMessage.version === 0
    );
}

/**
 * Use this function to assert that a transaction message is a v0 version
 *
 *
 * @example
 * ```ts
 * import { assertIsV0TransactionMessage } from '@solana/transaction-messages';
 *
 * try {
 *     // If this type assertion function doesn't throw, then
 *     // Typescript will upcast `message` to `V0TransactionMessage`.
 *     assertIsV0TransactionMessage(message);
 *     // At this point, `message` is a `V0TransactionMessage` that can be used
 *     // as required.
 *     const version = message.version // 0
 * } catch (e) {
 *     // `message` turned out not to not be a V0 transaction message
 * }
 * ```
 */
export function assertIsV0TransactionMessage(
    transactionMessage: LegacyTransactionMessage | V0TransactionMessage,
): asserts transactionMessage is V0TransactionMessage {
    if (!isV0TransactionMessage(transactionMessage)) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXPECTED_V0_TRANSACTION_MESSAGE);
    }
}
