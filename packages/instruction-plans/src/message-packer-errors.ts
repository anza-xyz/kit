import {
    isSolanaError,
    SOLANA_ERROR__INSTRUCTION_PLANS__INVALID_MAX_INSTRUCTIONS_PER_TRANSACTION,
    SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED,
    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN,
    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_REJECTED_BY_PACKER,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES,
    SolanaError,
} from '@solana/errors';

/**
 * The default maximum number of top-level instructions per planned transaction message.
 *
 * This is intentionally lower than the transaction format's instruction limit (see
 * {@link TRANSACTION_INSTRUCTION_LIMIT}) to leave headroom for inner instructions
 * (CPIs), which are not visible at planning time.
 */
const DEFAULT_MAX_INSTRUCTIONS_PER_TRANSACTION = 16;

/**
 * The hard maximum number of top-level instructions the transaction format can encode.
 *
 * Every current transaction version shares this limit. It is intentionally duplicated here —
 * rather than derived from `@solana/transactions` — so a configured maximum can be validated
 * without compiling a transaction message. If a future transaction version raises the limit,
 * update this constant (and consider making it version-aware).
 */
const TRANSACTION_INSTRUCTION_LIMIT = 64;

/**
 * Resolves the maximum number of instructions a message packer may put in a transaction message.
 *
 * Falls back to the default of 16 when no value is provided, which leaves headroom for inner
 * instructions (CPIs) that are not visible at planning time. A provided value must be a positive
 * integer no greater than `64` — the number of top-level instructions the transaction format can
 * encode.
 *
 * This is typically the first thing a custom {@link MessagePacker} does with the `maxInstructions`
 * option it receives in `packMessageToCapacity`.
 *
 * @example
 * ```ts
 * packMessageToCapacity: (message, config) => {
 *   const maxInstructions = resolveMaxInstructionsPerTransaction(config?.maxInstructions);
 *   assertMaxInstructionsPerTransaction(message.instructions.length + 1, maxInstructions);
 *   // ...
 * }
 * ```
 *
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__INVALID_MAX_INSTRUCTIONS_PER_TRANSACTION` if the provided
 * value is not a positive integer or exceeds the transaction format's instruction limit.
 *
 * @see {@link assertMaxInstructionsPerTransaction}
 */
export function resolveMaxInstructionsPerTransaction(maxInstructions?: number): number {
    if (
        maxInstructions !== undefined &&
        (maxInstructions <= 0 || !Number.isInteger(maxInstructions) || maxInstructions > TRANSACTION_INSTRUCTION_LIMIT)
    ) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__INVALID_MAX_INSTRUCTIONS_PER_TRANSACTION, {
            maxInstructions,
            transactionInstructionLimit: TRANSACTION_INSTRUCTION_LIMIT,
        });
    }
    return maxInstructions ?? DEFAULT_MAX_INSTRUCTIONS_PER_TRANSACTION;
}

/**
 * Asserts that a transaction message holding `numInstructions` instructions does not exceed the
 * given maximum number of instructions per transaction.
 *
 * Use it in a custom {@link MessagePacker} before appending an instruction — passing the count the
 * message would have after the append — so the transaction planner knows to pack the instruction
 * into another transaction message.
 *
 * @example
 * ```ts
 * packMessageToCapacity: (message, config) => {
 *   const maxInstructions = resolveMaxInstructionsPerTransaction(config?.maxInstructions);
 *   assertMaxInstructionsPerTransaction(message.instructions.length + 1, maxInstructions);
 *   return appendTransactionMessageInstruction(nextInstruction, message);
 * }
 * ```
 *
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED` if
 * `numInstructions` exceeds `maxInstructions`.
 *
 * @see {@link resolveMaxInstructionsPerTransaction}
 * @see {@link isMessagePackerErrorThatRequiresNewCandidate}
 */
export function assertMaxInstructionsPerTransaction(numInstructions: number, maxInstructions: number): void {
    if (numInstructions > maxInstructions) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED, {
            maxInstructions,
            numInstructions,
        });
    }
}

/**
 * Asserts that a transaction message can grow from `currentSize` to `nextSize` bytes without
 * exceeding `sizeLimit`.
 *
 * Use it in a custom {@link MessagePacker} after appending the next instruction(s) to the message
 * so the transaction planner knows to pack them into another transaction message. It works on
 * sizes rather than messages so that callers who already computed them do not pay for it twice.
 *
 * @example
 * ```ts
 * const nextMessage = appendTransactionMessageInstruction(nextInstruction, message);
 * assertMessageCanAccommodateSize({
 *   currentSize: getTransactionMessageSize(message),
 *   nextSize: getTransactionMessageSize(nextMessage),
 *   sizeLimit: getTransactionMessageSizeLimit(nextMessage),
 * });
 * return nextMessage;
 * ```
 *
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN` if `nextSize` exceeds
 * `sizeLimit`. The error reports how many bytes were required and how many were free.
 *
 * @see {@link isMessagePackerErrorThatRequiresNewCandidate}
 */
export function assertMessageCanAccommodateSize({
    currentSize,
    nextSize,
    sizeLimit,
}: {
    /** The size of the transaction message before packing the next instruction(s), in bytes. */
    currentSize: number;
    /** The size of the transaction message after packing the next instruction(s), in bytes. */
    nextSize: number;
    /** The maximum size of the transaction message, in bytes. */
    sizeLimit: number;
}): void {
    if (nextSize > sizeLimit) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
            numBytesRequired: nextSize - currentSize,
            numFreeBytes: sizeLimit - currentSize,
        });
    }
}

/**
 * A {@link SolanaError} that means the transaction message being packed cannot take the next
 * instruction(s) and a new candidate transaction message is required.
 *
 * This union covers every error the transaction planner treats as "try another message":
 * - `SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED`: the message
 *   already holds the maximum number of instructions.
 * - `SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN`: the message would exceed
 *   the transaction size limit.
 * - `SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_REJECTED_BY_PACKER`: a {@link MessagePacker} refused
 *   the message for a custom reason.
 * - `SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES`,
 *   `SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION`,
 *   `SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS` and
 *   `SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES`: the message could not be compiled
 *   because it references too many accounts, signers or instructions.
 *
 * @see {@link isMessagePackerErrorThatRequiresNewCandidate}
 */
export type MessagePackerErrorThatRequiresNewCandidate = SolanaError<
    | typeof SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED
    | typeof SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN
    | typeof SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_REJECTED_BY_PACKER
    | typeof SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES
    | typeof SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION
    | typeof SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS
    | typeof SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES
>;

/**
 * Identifies whether an error thrown whilst packing instructions into a transaction message means
 * that the message cannot take the instruction(s) and that a new candidate message is required.
 *
 * This is the set of errors the transaction planner treats as "try another message": the message
 * is too large, holds too many instructions, references too many accounts or signers, or was
 * rejected by a {@link MessagePacker} for a custom reason. Any other error is unexpected and
 * should propagate.
 *
 * @example
 * ```ts
 * try {
 *   message = messagePacker.packMessageToCapacity(message);
 * } catch (error) {
 *   if (!isMessagePackerErrorThatRequiresNewCandidate(error)) throw error;
 *   message = messagePacker.packMessageToCapacity(createNewMessage());
 * }
 * ```
 */
export function isMessagePackerErrorThatRequiresNewCandidate(
    error: unknown,
): error is MessagePackerErrorThatRequiresNewCandidate {
    return (
        isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED) ||
        isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN) ||
        isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_REJECTED_BY_PACKER) ||
        isSolanaError(error, SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES) ||
        isSolanaError(error, SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION) ||
        isSolanaError(error, SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS) ||
        isSolanaError(error, SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES)
    );
}
