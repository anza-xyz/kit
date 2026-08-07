/* eslint-disable @typescript-eslint/no-floating-promises */

import { Signature } from '@solana/keys';
import {
    setTransactionMessageLifetimeUsingBlockhash,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { compileTransaction, Transaction, TransactionWithBlockhashLifetime } from '@solana/transactions';

import {
    CanceledSingleTransactionPlanResult,
    createTransactionPlanExecutor,
    FailedSingleTransactionPlanResult,
    flattenTransactionPlanResult,
    passthroughFailedTransactionPlanExecution,
    SingleTransactionPlanResult,
    type SingleTransactionPlanResultWithOptionalSignature,
    SuccessfulSingleTransactionPlanResult,
    type SuccessfulSingleTransactionPlanResultWithOptionalSignature,
    summarizeTransactionPlanResult,
    type TransactionPlan,
    type TransactionPlanExecutor,
    type TransactionPlanExecutorConfig,
    type TransactionPlanResult,
    type TransactionPlanResultContext,
    type TransactionPlanResultWithOptionalSignature,
} from '../index';

// [DESCRIBE] TransactionPlanExecutor
{
    // Its return type satisfies TransactionPlanResult.
    {
        const transactionPlan = null as unknown as TransactionPlan;
        const executor = null as unknown as TransactionPlanExecutor;
        const result = executor(transactionPlan);
        result satisfies Promise<TransactionPlanResult>;
    }

    // Its return type keeps track of the executor context.
    {
        type CustomContext = { customData: string };
        const transactionPlan = null as unknown as TransactionPlan;
        const executor = null as unknown as TransactionPlanExecutor<CustomContext>;
        const result = executor(transactionPlan);
        result satisfies Promise<TransactionPlanResult<CustomContext>>;
    }
}

// [DESCRIBE] createTransactionPlanExecutor
{
    // It can return a signature or a full transaction.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Signature),
        });
        createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
        });
    }

    // It always receives a transaction message with fee payer.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: (_, message) => {
                message satisfies TransactionMessage & TransactionMessageWithFeePayer;
                return Promise.resolve({} as Transaction);
            },
        });
    }

    // It receives a base context by default.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: context => {
                context.message satisfies (TransactionMessage & TransactionMessageWithFeePayer) | undefined;
                context.transaction satisfies Transaction | undefined;
                context.signature satisfies Signature | undefined;
                return Promise.resolve({} as Signature);
            },
        });
    }

    // It removes undefined after assignment in the context.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: context => {
                // @ts-expect-error Initially, the context transaction may be undefined.
                context.transaction satisfies Transaction;
                context.transaction satisfies Transaction | undefined;
                const mySignedTransaction = {} as unknown as Transaction;
                context.transaction = mySignedTransaction;
                context.transaction satisfies Transaction;
                return Promise.resolve(context.transaction);
            },
        });
    }

    // It can use a custom context which is then assigned to the created TransactionPlanExecutor.
    {
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: (_: { custom: string }) => {
                return Promise.resolve({} as Signature);
            },
        });
        executor satisfies TransactionPlanExecutor<{ custom: string }>;
    }

    // It can use a custom context with the base context.
    {
        const executor = createTransactionPlanExecutor<{ custom: string }>({
            executeTransactionMessage: context => {
                context.custom satisfies string;
                context.message satisfies (TransactionMessage & TransactionMessageWithFeePayer) | undefined;
                context.transaction satisfies Transaction | undefined;
                context.signature satisfies Signature | undefined;
                return Promise.resolve({} as Signature);
            },
        });
        executor satisfies TransactionPlanExecutor<{ custom: string }>;
    }

    // It transfers the lifetime to the compiled transaction.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: (_, message) => {
                const latestBlockhash = {} as unknown as Parameters<
                    typeof setTransactionMessageLifetimeUsingBlockhash
                >[0];
                const messageWithBlockhash = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message);
                messageWithBlockhash satisfies TransactionMessageWithBlockhashLifetime;
                const transaction = compileTransaction(messageWithBlockhash);
                transaction satisfies TransactionWithBlockhashLifetime;
                return Promise.resolve(transaction);
            },
        });
    }

    // It returns strict single results when the flag is omitted.
    {
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
        });
        executor satisfies TransactionPlanExecutor;
    }

    // It returns strict single results when the flag is explicitly false.
    {
        const executor = createTransactionPlanExecutor({
            allowMissingFeePayerSignature: false,
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
        });
        executor satisfies TransactionPlanExecutor;
    }

    // It returns loose single results when the flag is true.
    {
        const executor = createTransactionPlanExecutor({
            allowMissingFeePayerSignature: true,
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
        });
        executor satisfies TransactionPlanExecutor<
            TransactionPlanResultContext,
            SingleTransactionPlanResultWithOptionalSignature
        >;
        // @ts-expect-error A loose executor is not assignable to a strict one.
        executor satisfies TransactionPlanExecutor;
    }

    // It fails closed, returning loose single results for a non-literal boolean.
    {
        const allowMissingFeePayerSignature = {} as boolean;
        const executor = createTransactionPlanExecutor({
            allowMissingFeePayerSignature,
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
        });
        // @ts-expect-error An unknown flag value must not narrow to the strict executor.
        executor satisfies TransactionPlanExecutor;
    }

    // A loose executor's successful results have an optional signature.
    {
        void (async () => {
            const executor = createTransactionPlanExecutor({
                allowMissingFeePayerSignature: true,
                executeTransactionMessage: () => Promise.resolve({} as Transaction),
            });
            const result = await executor(null as unknown as TransactionPlan);
            const single = flattenTransactionPlanResult(result)[0];
            single.context.signature satisfies Signature | undefined;
            // @ts-expect-error The signature may be absent.
            single.context.signature satisfies Signature;
        })();
    }
}

// [DESCRIBE] createTransactionPlanExecutor with allowMissingFeePayerSignature
{
    // Setting the flag narrows the callback to return a transaction.
    {
        createTransactionPlanExecutor({
            allowMissingFeePayerSignature: true,
            // @ts-expect-error A bare signature cannot be missing, so it is forbidden here.
            executeTransactionMessage: () => Promise.resolve({} as Signature),
        });
    }

    // Omitting the flag still allows either return value.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Signature),
        });
        createTransactionPlanExecutor({
            allowMissingFeePayerSignature: false,
            executeTransactionMessage: () => Promise.resolve({} as Signature),
        });
    }

    // A non-literal boolean still allows either return value, and guarantees nothing.
    {
        void (async () => {
            const allowMissingFeePayerSignature = {} as boolean;
            const executor = createTransactionPlanExecutor({
                allowMissingFeePayerSignature,
                executeTransactionMessage: () => Promise.resolve({} as Signature),
            });
            const single = flattenTransactionPlanResult(await executor(null as unknown as TransactionPlan))[0];
            if (single.status === 'successful') {
                // @ts-expect-error Neither guarantee can be established for a dynamic flag.
                single.context.transaction satisfies Transaction;
                // @ts-expect-error Neither guarantee can be established for a dynamic flag.
                single.context.signature satisfies Signature;
            }
        })();
    }

    // A successful result guarantees the transaction while leaving the signature optional.
    {
        void (async () => {
            const executor = createTransactionPlanExecutor({
                allowMissingFeePayerSignature: true,
                executeTransactionMessage: () => Promise.resolve({} as Transaction),
            });
            const single = flattenTransactionPlanResult(await executor(null as unknown as TransactionPlan))[0];
            if (single.status === 'successful') {
                single.context.transaction satisfies Transaction;
                single.context.signature satisfies Signature | undefined;
                // @ts-expect-error The signature may be absent.
                single.context.signature satisfies Signature;
            }
        })();
    }

    // Failed and canceled results do not inherit the transaction guarantee.
    {
        void (async () => {
            const executor = createTransactionPlanExecutor({
                allowMissingFeePayerSignature: true,
                executeTransactionMessage: () => Promise.resolve({} as Transaction),
            });
            const single = flattenTransactionPlanResult(await executor(null as unknown as TransactionPlan))[0];
            if (single.status === 'failed' || single.status === 'canceled') {
                single.context.transaction satisfies Transaction | undefined;
                // @ts-expect-error Execution may not have reached the point of building a transaction.
                single.context.transaction satisfies Transaction;
            }
        })();
    }

    // The guarantee composes with a custom context.
    {
        void (async () => {
            const executor = createTransactionPlanExecutor<{ custom: string }, true>({
                allowMissingFeePayerSignature: true,
                executeTransactionMessage: () => Promise.resolve({} as Transaction),
            });
            const single = flattenTransactionPlanResult(await executor(null as unknown as TransactionPlan))[0];
            if (single.status === 'successful') {
                single.context.custom satisfies string;
                single.context.transaction satisfies Transaction;
            }
        })();
    }
}

// [DESCRIBE] The transaction guarantee survives the consumer-facing helpers
{
    // summarizeTransactionPlanResult keeps it on successful transactions only.
    {
        void (async () => {
            const executor = createTransactionPlanExecutor({
                allowMissingFeePayerSignature: true,
                executeTransactionMessage: () => Promise.resolve({} as Transaction),
            });
            const summary = summarizeTransactionPlanResult(await executor(null as unknown as TransactionPlan));
            summary.successfulTransactions[0].context.transaction satisfies Transaction;
            summary.successfulTransactions[0].context.signature satisfies Signature | undefined;
            // @ts-expect-error The signature may be absent.
            summary.successfulTransactions[0].context.signature satisfies Signature;
            // @ts-expect-error A failed transaction may never have reached one.
            summary.failedTransactions[0].context.transaction satisfies Transaction;
            // @ts-expect-error A canceled transaction may never have reached one.
            summary.canceledTransactions[0].context.transaction satisfies Transaction;
        })();
    }

    // passthroughFailedTransactionPlanExecution keeps it.
    //
    // TRIPWIRE: this holds only because a loose result does not match the monomorphic strict
    // overloads and so reaches the generic one. Should `SuccessfulSingleTransactionPlanResult` ever
    // stop requiring `context.signature` — the breaking change that would let `TContext` carry both
    // guarantees — strict and loose become structurally identical, the first strict overload starts
    // matching loose results, and this assertion fails. The fix at that point is to delete the four
    // monomorphic overloads and keep only the generic one, NOT to relax this assertion.
    {
        void (async () => {
            const executor = createTransactionPlanExecutor({
                allowMissingFeePayerSignature: true,
                executeTransactionMessage: () => Promise.resolve({} as Transaction),
            });
            const result = await passthroughFailedTransactionPlanExecution(
                executor(null as unknown as TransactionPlan),
            );
            const single = flattenTransactionPlanResult(result)[0];
            if (single.status === 'successful') {
                single.context.transaction satisfies Transaction;
            }
        })();
    }
}

// [DESCRIBE] Which passthroughFailedTransactionPlanExecution overload is selected
{
    // A loose result reaches the generic overload, which preserves TContext.
    {
        void (async () => {
            const executor = createTransactionPlanExecutor<{ custom: string }, true>({
                allowMissingFeePayerSignature: true,
                executeTransactionMessage: () => Promise.resolve({} as Transaction),
            });
            const result = await passthroughFailedTransactionPlanExecution(
                executor(null as unknown as TransactionPlan),
            );
            flattenTransactionPlanResult(result)[0].context.custom satisfies string;
        })();
    }

    // A strict result matches a monomorphic overload first, which discards TContext. This is
    // pre-existing behaviour, unrelated to the signature and transaction guarantees. Together with
    // the test above it pins which overload wins, so collapsing the overload set flips this one to
    // an unused directive rather than failing silently.
    {
        void (async () => {
            const executor = createTransactionPlanExecutor<{ custom: string }>({
                executeTransactionMessage: () => Promise.resolve({} as Signature),
            });
            const result = await passthroughFailedTransactionPlanExecution(
                executor(null as unknown as TransactionPlan),
            );
            // @ts-expect-error The strict overload discards the custom context.
            flattenTransactionPlanResult(result)[0].context.custom satisfies string;
        })();
    }
}

// [DESCRIBE] createTransactionPlanExecutor call-site shapes found in the wild
{
    // It survives a `satisfies TransactionPlanExecutorConfig` annotation around a wrapped callback,
    // as used by `rpcTransactionPlanExecutor` in the kit-plugins repo.
    {
        const limitFunction = <TArguments extends unknown[], TReturnType>(
            fn: (...args: TArguments) => PromiseLike<TReturnType>,
            _maxConcurrency: number,
        ): ((...args: TArguments) => Promise<TReturnType>) => fn as never;
        const sendAndConfirmTransaction = (_tx: Transaction, _config?: { abortSignal?: AbortSignal }) =>
            Promise.resolve();
        const signTransactionMessageWithSigners = (
            _message: TransactionMessage & TransactionMessageWithFeePayer,
            _config?: { abortSignal?: AbortSignal },
        ) => Promise.resolve({} as Transaction);
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: limitFunction(async (context, transactionMessage, executorConfig) => {
                const latestBlockhash = {} as unknown as Parameters<
                    typeof setTransactionMessageLifetimeUsingBlockhash
                >[0];
                context.message = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, transactionMessage);
                const signedTransaction = await signTransactionMessageWithSigners(context.message, executorConfig);
                context.transaction = signedTransaction;
                await sendAndConfirmTransaction(signedTransaction, executorConfig);
                return signedTransaction;
            }, 10),
        } satisfies TransactionPlanExecutorConfig);
        executor satisfies TransactionPlanExecutor;
    }

    // A signing executor hands back a partially signed transaction and keeps the guarantee.
    {
        void (async () => {
            const partiallySignTransactionMessageWithSigners = (
                _message: TransactionMessage & TransactionMessageWithFeePayer,
            ) => Promise.resolve({} as Transaction);
            const executor = createTransactionPlanExecutor({
                allowMissingFeePayerSignature: true,
                executeTransactionMessage: async (context, message) => {
                    const transaction = await partiallySignTransactionMessageWithSigners(message);
                    context.transaction = transaction;
                    return transaction;
                },
            });
            const single = flattenTransactionPlanResult(await executor(null as unknown as TransactionPlan))[0];
            if (single.status === 'successful') {
                single.context.transaction satisfies Transaction;
            }
        })();
    }
}

// [DESCRIBE] passthroughFailedTransactionPlanExecution
{
    // It returns a single result when the provided promise expects a single result.
    {
        const promise = null as unknown as Promise<SingleTransactionPlanResult>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResult>);
    }

    // It widens the result of successful single results to include all possible single results.
    {
        const promise = null as unknown as Promise<SuccessfulSingleTransactionPlanResult>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResult>);
        // @ts-expect-error Can no longer expect successful result only.
        void (result satisfies Promise<SuccessfulSingleTransactionPlanResult>);
    }

    // It widens the result of canceled single results to include all possible single results.
    {
        const promise = null as unknown as Promise<CanceledSingleTransactionPlanResult>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResult>);
        // @ts-expect-error Can no longer expect canceled result only.
        void (result satisfies Promise<CanceledSingleTransactionPlanResult>);
    }

    // It widens the result of failed single results to include all possible single results.
    {
        const promise = null as unknown as Promise<FailedSingleTransactionPlanResult>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResult>);
        // @ts-expect-error Can no longer expect failed result only. It could be canceled too.
        void (result satisfies Promise<FailedSingleTransactionPlanResult>);
    }

    // It returns any TransactionPlanResult otherwise.
    {
        const promise = null as unknown as Promise<TransactionPlanResult>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<TransactionPlanResult>);
    }
}

// [DESCRIBE] passthroughFailedTransactionPlanExecution with optional signatures
{
    // It accepts a loose single result and widens it to all loose single results.
    {
        const promise = null as unknown as Promise<SuccessfulSingleTransactionPlanResultWithOptionalSignature>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResultWithOptionalSignature>);
        // @ts-expect-error Can no longer expect a successful result only.
        void (result satisfies Promise<SuccessfulSingleTransactionPlanResultWithOptionalSignature>);
    }

    // It accepts a loose result tree.
    {
        const promise = null as unknown as Promise<TransactionPlanResultWithOptionalSignature>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<TransactionPlanResultWithOptionalSignature>);
    }
}
