import type { Address } from '@solana/addresses';
import { isSolanaError, SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM, SolanaError } from '@solana/errors';

/**
 * Identifies whether an error -- typically caused by a transaction failure -- is a custom program
 * error from the provided program address.
 *
 * @param transactionMessage The transaction message that failed to execute. Since the RPC response
 * only provides the index of the failed instruction, the transaction message is required to
 * determine its program address
 * @param programAddress The address of the program from which the error is expected to have
 * originated
 * @param code The expected error code of the custom program error. When provided, the function will
 * check that the custom program error code matches the given value.
 *
 * @example
 * ```ts
 * try {
 *     // Send and confirm your transaction.
 * } catch (error) {
 *     if (isProgramError(error, transactionMessage, myProgramAddress, 42)) {
 *         // Handle custom program error 42 from this program.
 *     } else if (isProgramError(error, transactionMessage, myProgramAddress)) {
 *         // Handle all other custom program errors from this program.
 *     } else {
 *         throw error;
 *     }
 * }
 * ```
 */
export function isProgramError<TProgramErrorCode extends number>(
    error: unknown,
    transactionMessage: { instructions: Record<number, { programAddress: Address }> },
    programAddress: Address,
    code?: TProgramErrorCode,
): error is Readonly<{ context: Readonly<{ code: TProgramErrorCode }> }> &
    SolanaError<typeof SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM> {
    if (!isSolanaError(error, SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM)) {
        return false;
    }
    const instructionProgramAddress = transactionMessage.instructions[error.context.index]?.programAddress;
    if (!instructionProgramAddress || instructionProgramAddress !== programAddress) {
        return false;
    }
    return typeof code === 'undefined' || error.context.code === code;
}
