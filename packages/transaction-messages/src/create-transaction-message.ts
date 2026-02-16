import { TransactionMessage, TransactionVersion } from './transaction-message';
import { TransactionMessageWithinSizeLimit } from './transaction-message-size';

// Note: v1 transactions are not yet supported by these functions
type SupportedTransactionVersion = Exclude<TransactionVersion, 1>;

type TransactionConfig<TVersion extends SupportedTransactionVersion> = Readonly<{
    version: TVersion;
}>;

type EmptyTransactionMessage<TVersion extends SupportedTransactionVersion> = Omit<
    Extract<TransactionMessage, { version: TVersion }>,
    'instructions'
> &
    TransactionMessageWithinSizeLimit & { instructions: readonly [] };

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
export function createTransactionMessage<TVersion extends SupportedTransactionVersion>(
    config: TransactionConfig<TVersion>,
): EmptyTransactionMessage<TVersion> {
    return Object.freeze({
        instructions: Object.freeze([]),
        version: config.version,
    }) as EmptyTransactionMessage<TVersion>;
}
