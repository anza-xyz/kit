import { ExcludeTransactionMessageDurableNonceLifetime } from './durable-nonce';
import { BaseTransactionMessage } from './transaction-message';

/**
 * A helper type to reset the instructions of a transaction message to a new array of instructions.
 */
type ResetTransactionMessageInstructions<TTransactionMessage extends BaseTransactionMessage> = Omit<
    TTransactionMessage,
    'instructions'
> &
    Pick<BaseTransactionMessage, 'instructions'>;

/**
 * Given an instruction, this method will return a new transaction message with that instruction
 * having been added to the end of the list of existing instructions.
 *
 * @see {@link appendTransactionInstructions} if you need to append multiple instructions to a
 * transaction message.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import { appendTransactionMessageInstruction } from '@solana/transaction-messages';
 *
 * const memoTransaction = appendTransactionMessageInstruction(
 *     {
 *         data: new TextEncoder().encode('Hello world!'),
 *         programAddress: address('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
 *     },
 *     tx,
 * );
 * ```
 */
export function appendTransactionMessageInstruction<TTransactionMessage extends BaseTransactionMessage>(
    instruction: TTransactionMessage['instructions'][number],
    transactionMessage: TTransactionMessage,
): ResetTransactionMessageInstructions<TTransactionMessage> {
    return appendTransactionMessageInstructions([instruction], transactionMessage);
}

/**
 * Given an array of instructions, this method will return a new transaction message with those
 * instructions having been added to the end of the list of existing instructions.
 *
 * @see {@link appendTransactionInstruction} if you only need to append one instruction to a
 * transaction message.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import { appendTransactionMessageInstructions } from '@solana/transaction-messages';
 *
 * const memoTransaction = appendTransactionMessageInstructions(
 *     [
 *         {
 *             data: new TextEncoder().encode('Hello world!'),
 *             programAddress: address('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
 *         },
 *         {
 *             data: new TextEncoder().encode('How are you?'),
 *             programAddress: address('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
 *         },
 *     ],
 *     tx,
 * );
 * ```
 */
export function appendTransactionMessageInstructions<TTransactionMessage extends BaseTransactionMessage>(
    instructions: ReadonlyArray<TTransactionMessage['instructions'][number]>,
    transactionMessage: TTransactionMessage,
): ResetTransactionMessageInstructions<TTransactionMessage> {
    return Object.freeze({
        ...transactionMessage,
        instructions: Object.freeze([...transactionMessage.instructions, ...instructions]),
    });
}

/**
 * Given an instruction, this method will return a new transaction message with that instruction
 * having been added to the beginning of the list of existing instructions.
 *
 * @see {@link prependTransactionInstructions} if you need to prepend multiple instructions to a
 * transaction message.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import { prependTransactionMessageInstruction } from '@solana/transaction-messages';
 *
 * const memoTransaction = prependTransactionMessageInstruction(
 *     {
 *         data: new TextEncoder().encode('Hello world!'),
 *         programAddress: address('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
 *     },
 *     tx,
 * );
 * ```
 */
export function prependTransactionMessageInstruction<TTransactionMessage extends BaseTransactionMessage>(
    instruction: TTransactionMessage['instructions'][number],
    transactionMessage: TTransactionMessage,
): ExcludeTransactionMessageDurableNonceLifetime<ResetTransactionMessageInstructions<TTransactionMessage>> {
    return prependTransactionMessageInstructions([instruction], transactionMessage);
}

/**
 * Given an array of instructions, this method will return a new transaction message with those
 * instructions having been added to the beginning of the list of existing instructions.
 *
 * @see {@link prependTransactionInstruction} if you only need to prepend one instruction to a
 * transaction message.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import { prependTransactionMessageInstructions } from '@solana/transaction-messages';
 *
 * const memoTransaction = prependTransactionMessageInstructions(
 *     [
 *         {
 *             data: new TextEncoder().encode('Hello world!'),
 *             programAddress: address('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
 *         },
 *         {
 *             data: new TextEncoder().encode('How are you?'),
 *             programAddress: address('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
 *         },
 *     ],
 *     tx,
 * );
 * ```
 */
export function prependTransactionMessageInstructions<TTransactionMessage extends BaseTransactionMessage>(
    instructions: ReadonlyArray<TTransactionMessage['instructions'][number]>,
    transactionMessage: TTransactionMessage,
): ExcludeTransactionMessageDurableNonceLifetime<ResetTransactionMessageInstructions<TTransactionMessage>> {
    return Object.freeze({
        ...transactionMessage,
        instructions: Object.freeze([...instructions, ...transactionMessage.instructions]),
    }) as ExcludeTransactionMessageDurableNonceLifetime<TTransactionMessage>;
}
