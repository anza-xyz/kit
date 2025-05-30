import type { Address } from '@solana/addresses';
import { isSolanaError, SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM, SolanaError } from '@solana/errors';

/**
 * Identifies whether an error -- typically caused by a transaction failure -- is a custom program
 * error from the provided program address.
 *
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
 *     if (isProgramError(error, myProgramAddress, 42)) {
 *         // Handle custom program error 42 from this program.
 *     } else if (isProgramError(error, myProgramAddress)) {
 *         // Handle all other custom program errors from this program.
 *     } else {
 *         throw error;
 *     }
 * }
 * ```
 */
export function isProgramError<TProgramErrorCode extends number>(
    error: unknown,
    programAddress: Address,
    code?: TProgramErrorCode,
): error is Readonly<{ context: Readonly<{ code: TProgramErrorCode }> }> &
    SolanaError<typeof SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM>;
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
 *
 * @deprecated As of `solana-transaction-error` 3.0.0 the validator adds the address of the program
 * responsible for the error to the error itself, making it unnecessary to supply
 * `transactionMessage` here. Remove the `transactionMessage` argument. That argument will be
 * removed in version 4.0.0 of `@solana/kit`.
 */
export function isProgramError<TProgramErrorCode extends number>(
    error: unknown,
    transactionMessage: { instructions: Record<number, { programAddress: Address }> },
    programAddress: Address,
    code?: TProgramErrorCode,
): error is Readonly<{ context: Readonly<{ code: TProgramErrorCode }> }> &
    SolanaError<typeof SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM>;
export function isProgramError<TProgramErrorCode extends number>(
    error: unknown,
    transactionMessageOrProgramAddress: Address | { instructions: Record<number, { programAddress: Address }> },
    programAddressOrCode: Address | TProgramErrorCode,
    codeOrUndefined?: TProgramErrorCode,
): error is Readonly<{ context: Readonly<{ code: TProgramErrorCode }> }> &
    SolanaError<typeof SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM> {
    let transactionMessage;
    let programAddress;
    let code;
    if (typeof transactionMessageOrProgramAddress === 'string') {
        programAddress = transactionMessageOrProgramAddress as unknown as Address;
        code = programAddressOrCode as unknown as TProgramErrorCode;
    } else {
        transactionMessage = transactionMessageOrProgramAddress as unknown as {
            instructions: Record<number, { programAddress: Address }>;
        };
        programAddress = programAddressOrCode as unknown as Address;
        code = codeOrUndefined as TProgramErrorCode | null | undefined;
    }
    if (!isSolanaError(error, SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM)) {
        return false;
    }
    const responsibleProgramAddress =
        'responsibleProgramAddress' in error.context
            ? error.context.responsibleProgramAddress
            : transactionMessage?.instructions[error.context.index]?.programAddress;
    if (!responsibleProgramAddress || responsibleProgramAddress !== programAddress) {
        return false;
    }
    return typeof code === 'undefined' || error.context.code === code;
}
