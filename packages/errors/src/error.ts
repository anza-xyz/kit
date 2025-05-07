import { SolanaErrorCode, SolanaErrorCodeWithCause } from './codes';
import { SolanaErrorContext } from './context';
import { getErrorMessage } from './message-formatter';

/**
 * A type guard that returns `true` if the input is a {@link SolanaError}, optionally with a
 * particular error code.
 *
 * When the `code` argument is supplied and the input is a {@link SolanaError}, TypeScript will
 * refine the error's {@link SolanaError#context | `context`} property to the type associated with
 * that error code. You can use that context to render useful error messages, or to make
 * context-aware decisions that help your application to recover from the error.
 *
 * @example
 * ```ts
 * import {
 *     SOLANA_ERROR__TRANSACTION__MISSING_SIGNATURE,
 *     SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING,
 *     isSolanaError,
 * } from '@solana/errors';
 * import { assertIsFullySignedTransaction, getSignatureFromTransaction } from '@solana/transactions';
 *
 * try {
 *     const transactionSignature = getSignatureFromTransaction(tx);
 *     assertIsFullySignedTransaction(tx);
 *     /* ... *\/
 * } catch (e) {
 *     if (isSolanaError(e, SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING)) {
 *         displayError(
 *             "We can't send this transaction without signatures for these addresses:\n- %s",
 *             // The type of the `context` object is now refined to contain `addresses`.
 *             e.context.addresses.join('\n- '),
 *         );
 *         return;
 *     } else if (isSolanaError(e, SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING)) {
 *         if (!tx.feePayer) {
 *             displayError('Choose a fee payer for this transaction before sending it');
 *         } else {
 *             displayError('The fee payer still needs to sign for this transaction');
 *         }
 *         return;
 *     }
 *     throw e;
 * }
 * ```
 */
export function isSolanaError<TErrorCode extends SolanaErrorCode>(
    e: unknown,
    /**
     * When supplied, this function will require that the input is a {@link SolanaError} _and_ that
     * its error code is exactly this value.
     */
    code?: TErrorCode,
): e is SolanaError<TErrorCode> {
    const isSolanaError = e instanceof Error && e.name === 'SolanaError';
    if (isSolanaError) {
        if (code !== undefined) {
            return (e as SolanaError<TErrorCode>).context.__code === code;
        }
        return true;
    }
    return false;
}

type SolanaErrorCodedContext = Readonly<{
    [P in SolanaErrorCode]: (SolanaErrorContext[P] extends undefined ? object : SolanaErrorContext[P]) & {
        __code: P;
    };
}>;

/**
 * Encapsulates an error's stacktrace, a Solana-specific numeric code that indicates what went
 * wrong, and optional context if the type of error indicated by the code supports it.
 */
export class SolanaError<TErrorCode extends SolanaErrorCode = SolanaErrorCode> extends Error {
    /**
     * Indicates the root cause of this {@link SolanaError}, if any.
     *
     * For example, a transaction error might have an instruction error as its root cause. In this
     * case, you will be able to access the instruction error on the transaction error as `cause`.
     */
    readonly cause?: TErrorCode extends SolanaErrorCodeWithCause ? SolanaError : unknown = this.cause;
    /**
     * Contains context that can assist in understanding or recovering from a {@link SolanaError}.
     */
    readonly context: SolanaErrorCodedContext[TErrorCode];
    constructor(
        ...[code, contextAndErrorOptions]: SolanaErrorContext[TErrorCode] extends undefined
            ? [code: TErrorCode, errorOptions?: ErrorOptions | undefined]
            : [code: TErrorCode, contextAndErrorOptions: SolanaErrorContext[TErrorCode] & (ErrorOptions | undefined)]
    ) {
        let context: SolanaErrorContext[TErrorCode] | undefined;
        let errorOptions: ErrorOptions | undefined;
        if (contextAndErrorOptions) {
            // If the `ErrorOptions` type ever changes, update this code.
            const { cause, ...contextRest } = contextAndErrorOptions;
            if (cause) {
                errorOptions = { cause };
            }
            if (Object.keys(contextRest).length > 0) {
                context = contextRest as SolanaErrorContext[TErrorCode];
            }
        }
        const message = getErrorMessage(code, context);
        super(message, errorOptions);
        this.context = {
            __code: code,
            ...context,
        } as SolanaErrorCodedContext[TErrorCode];
        // This is necessary so that `isSolanaError()` can identify a `SolanaError` without having
        // to import the class for use in an `instanceof` check.
        this.name = 'SolanaError';
    }
}
