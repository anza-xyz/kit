import {
    SOLANA_ERROR__INSTRUCTION_PLANS__INVALID_MAX_INSTRUCTIONS_PER_TRANSACTION,
    SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED,
    SolanaError,
} from '@solana/errors';

/**
 * The default maximum number of top-level instructions per planned transaction message.
 *
 * This is intentionally lower than the transaction format's instruction limit (see
 * {@link TRANSACTION_INSTRUCTION_LIMIT}) to leave headroom for inner instructions
 * (CPIs), which are not visible at planning time.
 */
export const DEFAULT_MAX_INSTRUCTIONS_PER_TRANSACTION = 16;

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
 * Resolves the effective maximum number of instructions allowed in a transaction message.
 *
 * Falls back to 16 when no value is provided. The
 * provided value is expected to be a positive integer no greater than the transaction format's
 * instruction limit; validate it first with {@link assertValidMaxInstructionsPerTransaction}.
 */
export function resolveMaxInstructions(maxInstructions: number | undefined): number {
    return maxInstructions ?? DEFAULT_MAX_INSTRUCTIONS_PER_TRANSACTION;
}

/**
 * Asserts that a configured maximum number of instructions per transaction is valid.
 *
 * A configured maximum must be a positive integer no greater than the number of top-level
 * instructions the transaction format can encode (see {@link TRANSACTION_INSTRUCTION_LIMIT}).
 * Rejects values that are not positive integers. `undefined` is allowed and falls back to
 * the default.
 *
 * @throws {@link SOLANA_ERROR__INSTRUCTION_PLANS__INVALID_MAX_INSTRUCTIONS_PER_TRANSACTION}
 */
export function assertValidMaxInstructionsPerTransaction(maxInstructions: number | undefined): void {
    if (
        maxInstructions !== undefined &&
        (maxInstructions <= 0 || !Number.isInteger(maxInstructions) || maxInstructions > TRANSACTION_INSTRUCTION_LIMIT)
    ) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__INVALID_MAX_INSTRUCTIONS_PER_TRANSACTION, {
            maxInstructions,
            transactionInstructionLimit: TRANSACTION_INSTRUCTION_LIMIT,
        });
    }
}

/**
 * Throws if `numInstructions` exceeds `maxInstructions`.
 *
 * @throws {@link SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED}
 */
export function assertMaxInstructionsPerTransaction(numInstructions: number, maxInstructions: number): void {
    if (numInstructions > maxInstructions) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED, {
            maxInstructions,
            numInstructions,
        });
    }
}
