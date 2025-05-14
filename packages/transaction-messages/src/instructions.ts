import { Instruction } from '@solana/instructions';

import { ExcludeTransactionMessageDurableNonceLifetime } from './durable-nonce';
import { BaseTransactionMessage } from './transaction-message';
import { ExcludeTransactionMessageWithinSizeLimit } from './transaction-message-size';

/**
 * A helper type to append instructions to a transaction message
 * without losing type information about the current instructions.
 */
type AppendTransactionMessageInstructions<
    TTransactionMessage extends BaseTransactionMessage,
    TInstructions extends readonly Instruction[],
> = Omit<ExcludeTransactionMessageWithinSizeLimit<TTransactionMessage>, 'instructions'> & {
    readonly instructions: readonly [...TTransactionMessage['instructions'], ...TInstructions];
};

/**
 * A helper type to prepend instructions to a transaction message
 * without losing type information about the current instructions.
 */
type PrependTransactionMessageInstructions<
    TTransactionMessage extends BaseTransactionMessage,
    TInstructions extends readonly Instruction[],
> = Omit<
    ExcludeTransactionMessageWithinSizeLimit<ExcludeTransactionMessageDurableNonceLifetime<TTransactionMessage>>,
    'instructions'
> & {
    readonly instructions: readonly [...TInstructions, ...TTransactionMessage['instructions']];
};

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
export function appendTransactionMessageInstruction<
    TTransactionMessage extends BaseTransactionMessage,
    TInstruction extends Instruction,
>(
    instruction: TInstruction,
    transactionMessage: TTransactionMessage,
): AppendTransactionMessageInstructions<TTransactionMessage, [TInstruction]> {
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
export function appendTransactionMessageInstructions<
    TTransactionMessage extends BaseTransactionMessage,
    const TInstructions extends readonly Instruction[],
>(
    instructions: TInstructions,
    transactionMessage: TTransactionMessage,
): AppendTransactionMessageInstructions<TTransactionMessage, TInstructions> {
    return Object.freeze({
        ...transactionMessage,
        instructions: Object.freeze([
            ...(transactionMessage.instructions as TTransactionMessage['instructions']),
            ...instructions,
        ] as readonly [...TTransactionMessage['instructions'], ...TInstructions]),
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
export function prependTransactionMessageInstruction<
    TTransactionMessage extends BaseTransactionMessage,
    TInstruction extends Instruction,
>(
    instruction: TInstruction,
    transactionMessage: TTransactionMessage,
): PrependTransactionMessageInstructions<TTransactionMessage, [TInstruction]> {
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
export function prependTransactionMessageInstructions<
    TTransactionMessage extends BaseTransactionMessage,
    const TInstructions extends readonly Instruction[],
>(
    instructions: TInstructions,
    transactionMessage: TTransactionMessage,
): PrependTransactionMessageInstructions<TTransactionMessage, TInstructions> {
    return Object.freeze({
        ...(transactionMessage as ExcludeTransactionMessageDurableNonceLifetime<TTransactionMessage>),
        instructions: Object.freeze([
            ...instructions,
            ...(transactionMessage.instructions as TTransactionMessage['instructions']),
        ] as readonly [...TInstructions, ...TTransactionMessage['instructions']]),
    });
}
