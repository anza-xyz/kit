/**
 * Attaches a `transactionPlanResult` to an error context as a non-enumerable property, and returns
 * the context typed with it.
 *
 * The result is available on the error's `context` so that applications can recover from the
 * error, but it is non-enumerable so that it isn't serialized with the error. The `SolanaError`
 * constructor copies property descriptors, so the property stays non-enumerable on the error.
 *
 * @param context - The rest of the error context. It is mutated and returned.
 * @param transactionPlanResult - The transaction plan result to attach.
 * @return The same context object, typed with its `transactionPlanResult`.
 *
 * @internal
 */
export function withTransactionPlanResult<TContext extends object>(
    context: TContext,
    transactionPlanResult: unknown,
): TContext & { transactionPlanResult: unknown } {
    Object.defineProperty(context, 'transactionPlanResult', {
        configurable: false,
        enumerable: false,
        value: transactionPlanResult,
        writable: false,
    });
    return context as TContext & { transactionPlanResult: unknown };
}
