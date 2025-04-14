import { TransactionMessage, TransactionVersion } from './transaction-message';

type TransactionConfig<TVersion extends TransactionVersion> = Readonly<{
    version: TVersion;
}>;

/**
 * Given a {@link TransactionVersion} this method will return an empty transaction having the
 * capabilities of that version.
 *
 * @example
 * ```ts
 * import { createTransactionMessage } from '@solana/transaction-messages';
 *
 * const message = createTransactionMessage({ version: 0 });
 * ```
 */
export function createTransactionMessage<TVersion extends TransactionVersion>(
    config: TransactionConfig<TVersion>,
): Extract<TransactionMessage, { version: TVersion }>;
export function createTransactionMessage<TVersion extends TransactionVersion>({
    version,
}: TransactionConfig<TVersion>): TransactionMessage {
    return Object.freeze({
        instructions: Object.freeze([]),
        version,
    }) as TransactionMessage;
}
