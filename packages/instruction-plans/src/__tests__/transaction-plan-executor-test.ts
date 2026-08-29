import '@solana/test-matchers/toBeFrozenObject';

import {
    isSolanaError,
    SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT,
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN,
    SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED,
    SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND,
    SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE,
    SolanaError,
} from '@solana/errors';
import { Signature } from '@solana/keys';
import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
import { Transaction } from '@solana/transactions';

import {
    canceledSingleTransactionPlanResult,
    createTransactionPlanExecutor,
    createTransactionPlanExecutorWithConcurrentLeaves,
    failedSingleTransactionPlanResult,
    nonDivisibleSequentialTransactionPlan,
    nonDivisibleSequentialTransactionPlanResult,
    parallelTransactionPlan,
    parallelTransactionPlanResult,
    passthroughFailedTransactionPlanExecution,
    sequentialTransactionPlan,
    sequentialTransactionPlanResult,
    singleTransactionPlan,
    successfulSingleTransactionPlanResult,
    TransactionPlan,
    TransactionPlanResult,
    TransactionPlanResultContext,
    TransactionPlanResultContextWithSignature,
} from '../index';
import { createMessage, createPartiallySignedTransaction, createTransaction, FOREVER_PROMISE } from './__setup__';

jest.useFakeTimers();

async function expectFailedToExecute<TContext extends TransactionPlanResultContext>(
    promise: Promise<TransactionPlanResult<TContext>>,
    error: SolanaError<typeof SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN>,
): Promise<void> {
    const transactionPlanResult = error.context.transactionPlanResult;
    // Check for the error code and message (but not the full context since transactionPlanResult is non-enumerable)
    await expect(promise).rejects.toThrow(
        expect.objectContaining({
            context: expect.objectContaining({
                __code: SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN,
            }),
            name: 'SolanaError',
        }),
    );
    // This second expectation checks for transactionPlanResult which is a non-enumerable property
    await expect(promise).rejects.toThrow(
        expect.objectContaining({ context: expect.objectContaining({ transactionPlanResult }) }),
    );
}

function assertIsFailedToExecuteTransactionPlanError(
    error: unknown,
): asserts error is SolanaError<typeof SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN> {
    if (!isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)) {
        throw error;
    }
}

function forwardId(
    context: Partial<TransactionPlanResultContextWithSignature>,
    message: TransactionMessage & TransactionMessageWithFeePayer,
): Promise<TransactionPlanResultContextWithSignature> {
    const { id } = message as TransactionMessage & TransactionMessageWithFeePayer & { id: string };
    const transaction = createTransaction(id);
    context.transaction = transaction;
    return Promise.resolve({ signature: id as Signature, transaction });
}

/** Builds the successful result that executing `message` through the `forwardId` mock produces. */
function successfulForwardIdResult(
    message: TransactionMessage & TransactionMessageWithFeePayer & { id: string },
    context: TransactionPlanResultContext = {},
) {
    return successfulSingleTransactionPlanResult<TransactionPlanResultContextWithSignature>(message, {
        ...context,
        signature: message.id as Signature,
        transaction: createTransaction(message.id),
    });
}

describe('createTransactionPlanExecutor', () => {
    describe('single scenarios', () => {
        it('successfully executes a single transaction message', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(successfulForwardIdResult(messageA));
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, expect.any(Object), messageA, {
                abortSignal: undefined,
            });
        });

        it('passes the abort signal to the `executeTransactionMessage` function', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            await executor(singleTransactionPlan(messageA), { abortSignal });
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, expect.any(Object), messageA, { abortSignal });
        });

        it('uses the signature returned by the callback for the successful result', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: () => Promise.resolve({ signature: 'A' as Signature }),
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult(messageA, { signature: 'A' as Signature }),
            );
        });

        it('keeps context properties that the callback stored but did not return', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: context => {
                    context.transaction = transactionA;
                    return Promise.resolve({ signature: 'A' as Signature });
                },
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult(messageA, {
                    signature: 'A' as Signature,
                    transaction: transactionA,
                }),
            );
        });

        it('prefers the returned context over the one stored on the context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: context => {
                    context.signature = 'stale' as Signature;
                    return Promise.resolve({ signature: 'A' as Signature });
                },
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult(messageA, { signature: 'A' as Signature }),
            );
        });

        it('does not derive a signature from a transaction stored on the context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executor = createTransactionPlanExecutor<{ transaction: Transaction }>({
                executeTransactionMessage: () => Promise.resolve({ transaction: transactionA }),
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult<{ transaction: Transaction }>(messageA, {
                    transaction: transactionA,
                }),
            );
        });

        it('uses the context returned by the callback for the successful context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: () =>
                    // Note that the signature of `transactionA` is `A`; it is not derived here.
                    Promise.resolve({ signature: 'RETURNED_SIGNATURE' as Signature, transaction: transactionA }),
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult(messageA, {
                    signature: 'RETURNED_SIGNATURE' as Signature,
                    transaction: transactionA,
                }),
            );
        });

        it('succeeds when the stored transaction has no fee payer signature', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const partiallySignedTransactionA = createPartiallySignedTransaction('A');
            const executor = createTransactionPlanExecutor<{ transaction: Transaction }>({
                executeTransactionMessage: () => Promise.resolve({ transaction: partiallySignedTransactionA }),
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult<{ transaction: Transaction }>(messageA, {
                    transaction: partiallySignedTransactionA,
                }),
            );
        });

        it('stores the base context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: () =>
                    Promise.resolve({
                        message: createMessage('NEW A'),
                        signature: 'A' as Signature,
                        transaction: transactionA,
                    }),
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult(messageA, {
                    message: createMessage('NEW A'),
                    signature: 'A' as Signature,
                    transaction: transactionA,
                }),
            );
        });

        it('stores custom context properties', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const executor = createTransactionPlanExecutor<
                TransactionPlanResultContextWithSignature & { custom: string }
            >({
                executeTransactionMessage: () =>
                    Promise.resolve({
                        custom: 'custom value',
                        message: messageB,
                        signature: 'A' as Signature,
                    }),
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult(messageA, {
                    custom: 'custom value',
                    message: messageB,
                    signature: 'A' as Signature,
                }),
            );
        });

        it('fails to execute a single transaction message when the executor function rejects', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: () => Promise.reject(cause),
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: failedSingleTransactionPlanResult(messageA, cause),
                }),
            );
        });

        it('keeps all information provided to the context before failure', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const transactionA = createTransaction('A');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const throwCause = (): void => {
                throw cause;
            };
            type Context = TransactionPlanResultContextWithSignature & {
                afterFailure: string;
                beforeFailure: string;
            };
            const executor = createTransactionPlanExecutor<Context>({
                executeTransactionMessage: async context => {
                    context.beforeFailure = 'before failure';
                    context.message = messageB;
                    context.transaction = transactionA;
                    context.signature = 'B' as Signature;
                    throwCause();
                    context.afterFailure = 'after failure';
                    await Promise.resolve();
                    return context as Context; // Never reached; the callback always throws.
                },
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: failedSingleTransactionPlanResult(messageA, cause, {
                        beforeFailure: 'before failure',
                        message: messageB,
                        signature: 'B' as Signature,
                        transaction: transactionA,
                    }),
                }),
            );
        });

        it('does not add a signature to a failed context when a transaction is present', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const throwCause = (): void => {
                throw cause;
            };
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: async context => {
                    context.transaction = transactionA;
                    throwCause();
                    await Promise.resolve();
                    // Never reached; the callback always throws.
                    return context as TransactionPlanResultContextWithSignature;
                },
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: failedSingleTransactionPlanResult(messageA, cause, {
                        transaction: transactionA,
                    }),
                }),
            );
        });

        it('preserves the original error when the stored transaction has no fee payer signature', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const partiallySignedTransactionA = createPartiallySignedTransaction('A');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const throwCause = (): void => {
                throw cause;
            };
            const executor = createTransactionPlanExecutor<{ transaction: Transaction }>({
                executeTransactionMessage: async context => {
                    context.transaction = partiallySignedTransactionA;
                    throwCause();
                    await Promise.resolve();
                    // Never reached; the callback always throws.
                    return context as { transaction: Transaction };
                },
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: failedSingleTransactionPlanResult<{ transaction: Transaction }>(
                        messageA,
                        cause,
                        { transaction: partiallySignedTransactionA },
                    ),
                }),
            );
        });

        it('can use any error object as a failure cause', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const cause = new Error('Custom error message');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: () => Promise.reject(cause),
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: failedSingleTransactionPlanResult(messageA, cause),
                }),
            );
        });

        it('can abort single transaction plans', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const cause = new Error('Aborted during execution');
            const executeTransactionMessage = jest.fn().mockReturnValueOnce(FOREVER_PROMISE);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(singleTransactionPlan(messageA), { abortSignal });
            await jest.runAllTimersAsync();
            abortController.abort(cause);

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: failedSingleTransactionPlanResult(messageA, cause),
                }),
            );
        });

        it('can abort single transaction plans before execution', async () => {
            expect.assertions(3);
            const messageA = createMessage('A');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const cause = new Error('Aborted before execution');
            const executeTransactionMessage = jest.fn().mockReturnValueOnce(FOREVER_PROMISE);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            abortController.abort(cause);
            const promise = executor(singleTransactionPlan(messageA), { abortSignal });

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: canceledSingleTransactionPlanResult(messageA),
                }),
            );

            expect(executeTransactionMessage).not.toHaveBeenCalled();
        });

        it('includes the abort reason in the error context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const abortReason = new Error('User canceled');
            const executeTransactionMessage = jest.fn().mockReturnValueOnce(FOREVER_PROMISE);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(singleTransactionPlan(messageA), { abortSignal });
            await jest.runAllTimersAsync();
            abortController.abort(abortReason);

            await expect(promise).rejects.toThrow(
                expect.objectContaining({
                    context: expect.objectContaining({
                        abortReason,
                    }),
                }),
            );
        });

        it('freezes the returned single transaction plan result', async () => {
            expect.assertions(1);
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const result = await executor(singleTransactionPlan(createMessage('A')));
            expect(result).toBeFrozenObject();
        });
    });

    describe('sequential scenarios', () => {
        it('successfully executes a sequential transaction plan', async () => {
            expect.assertions(4);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(sequentialTransactionPlan([messageA, messageB]));
            await expect(promise).resolves.toStrictEqual(
                sequentialTransactionPlanResult([
                    successfulForwardIdResult(messageA),
                    successfulForwardIdResult(messageB),
                ]),
            );

            expect(executeTransactionMessage).toHaveBeenCalledTimes(2);
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, expect.any(Object), messageA, {
                abortSignal: undefined,
            });
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(2, expect.any(Object), messageB, {
                abortSignal: undefined,
            });
        });

        it('throws when encountering a non-divisible sequential transaction plan', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(nonDivisibleSequentialTransactionPlan([messageA, messageB]));
            await expect(promise).rejects.toThrow(
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED),
            );
        });

        it('does no execute transactions before checking for non-divisible plans', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            await executor(
                sequentialTransactionPlan([messageA, nonDivisibleSequentialTransactionPlan([messageB, messageC])]),
            ).catch(() => {});
            expect(executeTransactionMessage).not.toHaveBeenCalled();
        });

        it('passes the abort signal to the `executeTransactionMessage` function', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            await executor(sequentialTransactionPlan([messageA, messageB]), { abortSignal });
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, expect.any(Object), messageA, { abortSignal });
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(2, expect.any(Object), messageB, { abortSignal });
        });

        it('executes a sequential transaction plan with custom context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const executor = createTransactionPlanExecutor<
                TransactionPlanResultContextWithSignature & { custom: string }
            >({
                executeTransactionMessage: async (context, message) => {
                    const id = (message as TransactionMessage & TransactionMessageWithFeePayer & { id: string }).id;
                    const custom = 'Message ' + id;
                    context.custom = custom;
                    return { ...(await forwardId(context, message)), custom };
                },
            });

            const promise = executor(sequentialTransactionPlan([messageA, messageB]));
            await expect(promise).resolves.toStrictEqual(
                sequentialTransactionPlanResult([
                    successfulForwardIdResult(messageA, { custom: 'Message A' }),
                    successfulForwardIdResult(messageB, { custom: 'Message B' }),
                ]),
            );
        });

        it('fails to execute a sequential transaction plan when the executor function rejects', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const executeTransactionMessage = jest.fn().mockImplementationOnce(forwardId).mockRejectedValueOnce(cause);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(sequentialTransactionPlan([messageA, messageB]));
            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: sequentialTransactionPlanResult([
                        successfulForwardIdResult(messageA),
                        failedSingleTransactionPlanResult(messageB, cause),
                    ]),
                }),
            );
        });

        it('cancels subsequent plans after one fails', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const executeTransactionMessage = jest.fn().mockRejectedValueOnce(cause).mockImplementationOnce(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(sequentialTransactionPlan([messageA, messageB]));
            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: sequentialTransactionPlanResult([
                        failedSingleTransactionPlanResult(messageA, cause),
                        canceledSingleTransactionPlanResult(messageB),
                    ]),
                }),
            );
        });

        it('does not call `executeTransactionMessage` on subsequently canceled plans', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const executeTransactionMessage = jest.fn().mockRejectedValueOnce(cause).mockImplementationOnce(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            await executor(sequentialTransactionPlan([messageA, messageB])).catch(() => {});
            expect(executeTransactionMessage).toHaveBeenCalledTimes(1);
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, expect.any(Object), messageA, {
                abortSignal: undefined,
            });
        });

        it('can abort sequential transaction plans', async () => {
            expect.assertions(6);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const cause = new Error('Aborted during execution');
            const executeTransactionMessage = jest
                .fn()
                .mockImplementationOnce(forwardId)
                .mockResolvedValueOnce(FOREVER_PROMISE)
                .mockImplementationOnce(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(sequentialTransactionPlan([messageA, messageB, messageC]), { abortSignal });
            await jest.runAllTimersAsync();
            abortController.abort(cause);

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: sequentialTransactionPlanResult([
                        successfulForwardIdResult(messageA),
                        failedSingleTransactionPlanResult(messageB, cause),
                        canceledSingleTransactionPlanResult(messageC),
                    ]),
                }),
            );

            expect(executeTransactionMessage).toHaveBeenCalledTimes(2);
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, expect.any(Object), messageA, { abortSignal });
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(2, expect.any(Object), messageB, { abortSignal });
            expect(executeTransactionMessage).not.toHaveBeenCalledWith(expect.any(Object), messageC, { abortSignal });
        });

        it('can abort sequential transaction plans before execution', async () => {
            expect.assertions(3);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const cause = new Error('Aborted before execution');
            const executeTransactionMessage = jest.fn();
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            abortController.abort(cause);
            const promise = executor(sequentialTransactionPlan([messageA, messageB]), { abortSignal });

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: sequentialTransactionPlanResult([
                        canceledSingleTransactionPlanResult(messageA),
                        canceledSingleTransactionPlanResult(messageB),
                    ]),
                }),
            );

            expect(executeTransactionMessage).not.toHaveBeenCalled();
        });

        it('freezes the returned sequential transaction plan result', async () => {
            expect.assertions(1);
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const result = await executor(sequentialTransactionPlan([createMessage('A'), createMessage('B')]));
            expect(result).toBeFrozenObject();
        });
    });

    describe('parallel scenarios', () => {
        it('successfully executes a parallel transaction plan', async () => {
            expect.assertions(4);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(parallelTransactionPlan([messageA, messageB]));
            await expect(promise).resolves.toStrictEqual(
                parallelTransactionPlanResult([
                    successfulForwardIdResult(messageA),
                    successfulForwardIdResult(messageB),
                ]),
            );

            expect(executeTransactionMessage).toHaveBeenCalledTimes(2);
            expect(executeTransactionMessage).toHaveBeenCalledWith(expect.any(Object), messageA, {
                abortSignal: undefined,
            });
            expect(executeTransactionMessage).toHaveBeenCalledWith(expect.any(Object), messageB, {
                abortSignal: undefined,
            });
        });

        it('passes the abort signal to the `executeTransactionMessage` function', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            await executor(parallelTransactionPlan([messageA, messageB]), { abortSignal });
            expect(executeTransactionMessage).toHaveBeenCalledWith(expect.any(Object), messageA, { abortSignal });
            expect(executeTransactionMessage).toHaveBeenCalledWith(expect.any(Object), messageB, { abortSignal });
        });

        it('executes a parallel transaction plan with custom context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const executor = createTransactionPlanExecutor<
                TransactionPlanResultContextWithSignature & { custom: string }
            >({
                executeTransactionMessage: async (context, message) => {
                    const id = (message as TransactionMessage & TransactionMessageWithFeePayer & { id: string }).id;
                    const custom = 'Message ' + id;
                    context.custom = custom;
                    return { ...(await forwardId(context, message)), custom };
                },
            });

            const promise = executor(parallelTransactionPlan([messageA, messageB]));
            await expect(promise).resolves.toStrictEqual(
                parallelTransactionPlanResult([
                    successfulForwardIdResult(messageA, { custom: 'Message A' }),
                    successfulForwardIdResult(messageB, { custom: 'Message B' }),
                ]),
            );
        });

        it('partially fails to execute a parallel transaction plan when the executor function rejects', async () => {
            expect.assertions(3);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const executeTransactionMessage = jest
                .fn()
                .mockImplementation(
                    (context, message: TransactionMessage & TransactionMessageWithFeePayer & { id: string }) => {
                        // eslint-disable-next-line jest/no-conditional-in-test
                        return message.id === 'B' ? Promise.reject(cause) : forwardId(context, message);
                    },
                );
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(parallelTransactionPlan([messageA, messageB, messageC]));
            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: parallelTransactionPlanResult([
                        successfulForwardIdResult(messageA),
                        failedSingleTransactionPlanResult(messageB, cause),
                        successfulForwardIdResult(messageC),
                    ]),
                }),
            );

            expect(executeTransactionMessage).toHaveBeenCalledTimes(3);
        });

        it('can abort parallel transaction plans', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const cause = new Error('Aborted during execution');
            const executeTransactionMessage = jest
                .fn()
                .mockImplementation(
                    (context, message: TransactionMessage & TransactionMessageWithFeePayer & { id: string }) => {
                        // eslint-disable-next-line jest/no-conditional-in-test
                        return message.id === 'B' ? FOREVER_PROMISE : forwardId(context, message);
                    },
                );
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(parallelTransactionPlan([messageA, messageB, messageC]), { abortSignal });
            await jest.runAllTimersAsync();
            abortController.abort(cause);

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: parallelTransactionPlanResult([
                        successfulForwardIdResult(messageA),
                        failedSingleTransactionPlanResult(messageB, cause),
                        successfulForwardIdResult(messageC),
                    ]),
                }),
            );
        });

        it('can abort parallel transaction plans before execution', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const cause = new Error('Aborted before execution');
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            abortController.abort(cause);
            const promise = executor(parallelTransactionPlan([messageA, messageB, messageC]), { abortSignal });

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: parallelTransactionPlanResult([
                        canceledSingleTransactionPlanResult(messageA),
                        canceledSingleTransactionPlanResult(messageB),
                        canceledSingleTransactionPlanResult(messageC),
                    ]),
                }),
            );
        });

        it('freezes the returned transaction plan result', async () => {
            expect.assertions(1);
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const result = await executor(parallelTransactionPlan([createMessage('A'), createMessage('B')]));
            expect(result).toBeFrozenObject();
        });
    });

    describe('complex scenarios', () => {
        it('successfully executes a complex transaction plan', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const messageD = createMessage('D');
            const messageE = createMessage('E');
            const messageF = createMessage('F');
            const messageG = createMessage('G');
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(
                parallelTransactionPlan([
                    sequentialTransactionPlan([messageA, parallelTransactionPlan([messageB, messageC]), messageD]),
                    messageE,
                    sequentialTransactionPlan([messageF, messageG]),
                ]),
            );

            await expect(promise).resolves.toStrictEqual(
                parallelTransactionPlanResult([
                    sequentialTransactionPlanResult([
                        successfulForwardIdResult(messageA),
                        parallelTransactionPlanResult([
                            successfulForwardIdResult(messageB),
                            successfulForwardIdResult(messageC),
                        ]),
                        successfulForwardIdResult(messageD),
                    ]),
                    successfulForwardIdResult(messageE),
                    sequentialTransactionPlanResult([
                        successfulForwardIdResult(messageF),
                        successfulForwardIdResult(messageG),
                    ]),
                ]),
            );

            expect(executeTransactionMessage).toHaveBeenCalledTimes(7);
        });

        it('fails to executes a complex transaction plan when the executor function rejects', async () => {
            expect.assertions(3);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const messageD = createMessage('D');
            const messageE = createMessage('E');
            const messageF = createMessage('F');
            const messageG = createMessage('G');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const executeTransactionMessage = jest
                .fn()
                .mockImplementation(
                    (context, message: TransactionMessage & TransactionMessageWithFeePayer & { id: string }) => {
                        // eslint-disable-next-line jest/no-conditional-in-test
                        return message.id === 'C' ? Promise.reject(cause) : forwardId(context, message);
                    },
                );
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(
                parallelTransactionPlan([
                    sequentialTransactionPlan([messageA, parallelTransactionPlan([messageB, messageC]), messageD]),
                    messageE,
                    sequentialTransactionPlan([messageF, messageG]),
                ]),
            );

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: parallelTransactionPlanResult([
                        sequentialTransactionPlanResult([
                            successfulForwardIdResult(messageA),
                            parallelTransactionPlanResult([
                                successfulForwardIdResult(messageB),
                                failedSingleTransactionPlanResult(messageC, cause),
                            ]),
                            canceledSingleTransactionPlanResult(messageD),
                        ]),
                        successfulForwardIdResult(messageE),
                        sequentialTransactionPlanResult([
                            successfulForwardIdResult(messageF),
                            successfulForwardIdResult(messageG),
                        ]),
                    ]),
                }),
            );

            expect(executeTransactionMessage).toHaveBeenCalledTimes(6);
        });

        it('can abort a complex transaction plan', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const messageD = createMessage('D');
            const messageE = createMessage('E');
            const messageF = createMessage('F');
            const messageG = createMessage('G');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const cause = new Error('Aborted during execution');
            const executeTransactionMessage = jest
                .fn()
                .mockImplementation(
                    (context, message: TransactionMessage & TransactionMessageWithFeePayer & { id: string }) => {
                        // eslint-disable-next-line jest/no-conditional-in-test
                        return message.id === 'C' ? FOREVER_PROMISE : forwardId(context, message);
                    },
                );
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(
                parallelTransactionPlan([
                    sequentialTransactionPlan([messageA, parallelTransactionPlan([messageB, messageC]), messageD]),
                    messageE,
                    sequentialTransactionPlan([messageF, messageG]),
                ]),
                { abortSignal },
            );

            await jest.runAllTimersAsync();
            abortController.abort(cause);

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: parallelTransactionPlanResult([
                        sequentialTransactionPlanResult([
                            successfulForwardIdResult(messageA),
                            parallelTransactionPlanResult([
                                successfulForwardIdResult(messageB),
                                failedSingleTransactionPlanResult(messageC, cause),
                            ]),
                            canceledSingleTransactionPlanResult(messageD),
                        ]),
                        successfulForwardIdResult(messageE),
                        sequentialTransactionPlanResult([
                            successfulForwardIdResult(messageF),
                            successfulForwardIdResult(messageG),
                        ]),
                    ]),
                }),
            );
        });

        it('can abort a complex transaction plan before execution', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const messageD = createMessage('D');
            const messageE = createMessage('E');
            const messageF = createMessage('F');
            const messageG = createMessage('G');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const cause = new Error('Aborted during execution');
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            abortController.abort(cause);
            const promise = executor(
                parallelTransactionPlan([
                    sequentialTransactionPlan([messageA, parallelTransactionPlan([messageB, messageC]), messageD]),
                    messageE,
                    sequentialTransactionPlan([messageF, messageG]),
                ]),
                { abortSignal },
            );

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: parallelTransactionPlanResult([
                        sequentialTransactionPlanResult([
                            canceledSingleTransactionPlanResult(messageA),
                            parallelTransactionPlanResult([
                                canceledSingleTransactionPlanResult(messageB),
                                canceledSingleTransactionPlanResult(messageC),
                            ]),
                            canceledSingleTransactionPlanResult(messageD),
                        ]),
                        canceledSingleTransactionPlanResult(messageE),
                        sequentialTransactionPlanResult([
                            canceledSingleTransactionPlanResult(messageF),
                            canceledSingleTransactionPlanResult(messageG),
                        ]),
                    ]),
                }),
            );
        });
    });
});

describe('createTransactionPlanExecutorWithConcurrentLeaves', () => {
    it('preserves plan nesting, order, and divisibility', async () => {
        expect.assertions(1);
        const messages = [createMessage('A'), createMessage('B'), createMessage('C'), createMessage('D')];
        const transactionPlan = parallelTransactionPlan([
            nonDivisibleSequentialTransactionPlan([messages[0], messages[1]]),
            sequentialTransactionPlan([messages[2], messages[3]]),
        ]);
        const executor = createTransactionPlanExecutorWithConcurrentLeaves({ executeTransactionMessage: forwardId });

        const result = await executor(transactionPlan);

        expect(result).toStrictEqual(
            parallelTransactionPlanResult([
                nonDivisibleSequentialTransactionPlanResult([
                    successfulForwardIdResult(messages[0]),
                    successfulForwardIdResult(messages[1]),
                ]),
                sequentialTransactionPlanResult([
                    successfulForwardIdResult(messages[2]),
                    successfulForwardIdResult(messages[3]),
                ]),
            ]),
        );
    });

    it('starts leaves in sequential plans concurrently', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const executeTransactionMessage = jest.fn(
            () => FOREVER_PROMISE as Promise<TransactionPlanResultContextWithSignature>,
        );
        const executor = createTransactionPlanExecutorWithConcurrentLeaves({ executeTransactionMessage });

        void executor(sequentialTransactionPlan([messageA, messageB]));

        expect(executeTransactionMessage).toHaveBeenCalledTimes(2);
    });

    it('aggregates thrown leaf errors without canceling other leaves', async () => {
        expect.assertions(4);
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const messageC = createMessage('C');
        const errorA = new Error('A failed');
        const errorC = new Error('C failed');
        const messages = [messageA, messageB, messageC];
        const leafPromises = [Promise.reject(errorA), Promise.resolve({ id: 'B' }), Promise.reject(errorC)];
        const executeTransactionMessage = jest.fn(
            (_context: Partial<{ id: string }>, message: TransactionMessage & TransactionMessageWithFeePayer) =>
                leafPromises[messages.indexOf(message as (typeof messages)[number])],
        );
        const executor = createTransactionPlanExecutorWithConcurrentLeaves<{ id: string }>({
            executeTransactionMessage,
        });

        const error = await executor(nonDivisibleSequentialTransactionPlan([messageA, messageB, messageC])).catch(
            (error: unknown) => error,
        );

        expect(isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)).toBe(true);
        assertIsFailedToExecuteTransactionPlanError(error);
        expect(executeTransactionMessage).toHaveBeenCalledTimes(3);
        expect(error.context.transactionPlanResult).toStrictEqual(
            nonDivisibleSequentialTransactionPlanResult([
                failedSingleTransactionPlanResult<{ id: string }>(messageA, errorA),
                successfulSingleTransactionPlanResult(messageB, { id: 'B' }),
                failedSingleTransactionPlanResult<{ id: string }>(messageC, errorC),
            ]),
        );
        expect(error.cause).toBe(errorA);
    });

    it('preserves nested failures and waits for every sibling to settle', async () => {
        expect.assertions(5);
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const messageC = createMessage('C');
        const messageD = createMessage('D');
        const messageE = createMessage('E');
        const errorB = new Error('B failed');
        const errorD = new Error('D failed');
        const messages = [messageA, messageB, messageC, messageD, messageE];
        const delayedContextPromise = new Promise<{ id: string }>(resolve => {
            setTimeout(() => resolve({ id: 'E' }), 100);
        });
        const leafPromises = [
            Promise.resolve({ id: 'A' }),
            Promise.reject(errorB),
            Promise.resolve({ id: 'C' }),
            Promise.reject(errorD),
            delayedContextPromise,
        ];
        const executeTransactionMessage = jest.fn(
            (_context: Partial<{ id: string }>, message: TransactionMessage & TransactionMessageWithFeePayer) =>
                leafPromises[messages.indexOf(message as (typeof messages)[number])],
        );
        const executor = createTransactionPlanExecutorWithConcurrentLeaves<{ id: string }>({
            executeTransactionMessage,
        });
        const transactionPlan = parallelTransactionPlan([
            nonDivisibleSequentialTransactionPlan([messageA, parallelTransactionPlan([messageB, messageC])]),
            sequentialTransactionPlan([messageD, messageE]),
        ]);

        const resultPromise = executor(transactionPlan);
        const onSettled = jest.fn();
        void resultPromise.then(onSettled, onSettled);
        await jest.advanceTimersByTimeAsync(99);
        expect(onSettled).not.toHaveBeenCalled();
        await jest.advanceTimersByTimeAsync(1);
        const error = await resultPromise.catch((error: unknown) => error);

        expect(isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)).toBe(true);
        assertIsFailedToExecuteTransactionPlanError(error);
        expect(executeTransactionMessage).toHaveBeenCalledTimes(5);
        expect(error.context.transactionPlanResult).toStrictEqual(
            parallelTransactionPlanResult([
                nonDivisibleSequentialTransactionPlanResult([
                    successfulSingleTransactionPlanResult(messageA, { id: 'A' }),
                    parallelTransactionPlanResult([
                        failedSingleTransactionPlanResult<{ id: string }>(messageB, errorB),
                        successfulSingleTransactionPlanResult(messageC, { id: 'C' }),
                    ]),
                ]),
                sequentialTransactionPlanResult([
                    failedSingleTransactionPlanResult<{ id: string }>(messageD, errorD),
                    successfulSingleTransactionPlanResult(messageE, { id: 'E' }),
                ]),
            ]),
        );
        expect(error.cause).toBe(errorB);
    });

    it('can abort before executing leaves', async () => {
        expect.assertions(4);
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const abortController = new AbortController();
        const cause = new Error('Aborted before execution');
        const executeTransactionMessage = jest.fn(() => Promise.reject(new Error('not implemented')));
        const executor = createTransactionPlanExecutorWithConcurrentLeaves<TransactionPlanResultContext>({
            executeTransactionMessage,
        });

        abortController.abort(cause);
        const error = await executor(parallelTransactionPlan([messageA, messageB]), {
            abortSignal: abortController.signal,
        }).catch((error: unknown) => error);

        expect(isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)).toBe(true);
        assertIsFailedToExecuteTransactionPlanError(error);
        expect(executeTransactionMessage).not.toHaveBeenCalled();
        expect(error.context.transactionPlanResult).toStrictEqual(
            parallelTransactionPlanResult([
                canceledSingleTransactionPlanResult<TransactionPlanResultContext>(messageA),
                canceledSingleTransactionPlanResult<TransactionPlanResultContext>(messageB),
            ]),
        );
        expect(error.context.abortReason).toBe(cause);
    });

    it('can abort active leaves while preserving completed leaves', async () => {
        expect.assertions(4);
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const messageC = createMessage('C');
        const abortController = new AbortController();
        const cause = new Error('Aborted during execution');
        const messages = [messageA, messageB, messageC];
        const leafPromises = [
            Promise.resolve({ signature: 'A' as Signature, transaction: createTransaction('A') }),
            FOREVER_PROMISE as Promise<TransactionPlanResultContextWithSignature>,
            Promise.resolve({ signature: 'C' as Signature, transaction: createTransaction('C') }),
        ];
        const executeTransactionMessage = jest.fn(
            (
                _context: Partial<TransactionPlanResultContextWithSignature>,
                message: TransactionMessage & TransactionMessageWithFeePayer,
            ) => leafPromises[messages.indexOf(message as (typeof messages)[number])],
        );
        const executor = createTransactionPlanExecutorWithConcurrentLeaves({ executeTransactionMessage });

        const resultPromise = executor(parallelTransactionPlan([messageA, messageB, messageC]), {
            abortSignal: abortController.signal,
        });
        expect(executeTransactionMessage).toHaveBeenCalledTimes(3);
        await jest.runAllTimersAsync();
        abortController.abort(cause);
        const error = await resultPromise.catch((error: unknown) => error);

        expect(isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)).toBe(true);
        assertIsFailedToExecuteTransactionPlanError(error);
        expect(error.context.transactionPlanResult).toStrictEqual(
            parallelTransactionPlanResult([
                successfulForwardIdResult(messageA),
                failedSingleTransactionPlanResult(messageB, cause),
                successfulForwardIdResult(messageC),
            ]),
        );
        expect(error.context.abortReason).toBe(cause);
    });

    it('passes the abort signal to the `executeTransactionMessage` function', async () => {
        expect.assertions(1);
        const messageA = createMessage('A');
        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
        const executor = createTransactionPlanExecutorWithConcurrentLeaves({ executeTransactionMessage });

        await executor(singleTransactionPlan(messageA), { abortSignal });
        expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, expect.any(Object), messageA, { abortSignal });
    });

    it('preserves the context mutated by a leaf callback that throws', async () => {
        expect.assertions(2);
        const message = createMessage('A');
        const cause = new Error('A failed');
        const executor = createTransactionPlanExecutorWithConcurrentLeaves<{ attempted: boolean }>({
            executeTransactionMessage: context => {
                context.attempted = true;
                return Promise.reject(cause);
            },
        });

        const error = await executor(singleTransactionPlan(message)).catch((error: unknown) => error);

        expect(isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)).toBe(true);
        assertIsFailedToExecuteTransactionPlanError(error);
        expect(error.context.transactionPlanResult).toStrictEqual(
            failedSingleTransactionPlanResult<{ attempted: boolean }>(message, cause, { attempted: true }),
        );
    });

    it('preserves the context mutated by a leaf callback that is aborted mid-flight', async () => {
        expect.assertions(2);
        const message = createMessage('A');
        const abortController = new AbortController();
        const cause = new Error('Aborted during execution');
        const executor = createTransactionPlanExecutorWithConcurrentLeaves<{ attempted: boolean }>({
            executeTransactionMessage: context => {
                context.attempted = true;
                return FOREVER_PROMISE as Promise<never>;
            },
        });

        const resultPromise = executor(singleTransactionPlan(message), { abortSignal: abortController.signal });
        await jest.runAllTimersAsync();
        abortController.abort(cause);
        const error = await resultPromise.catch((error: unknown) => error);

        expect(isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)).toBe(true);
        assertIsFailedToExecuteTransactionPlanError(error);
        expect(error.context.transactionPlanResult).toStrictEqual(
            failedSingleTransactionPlanResult<{ attempted: boolean }>(message, cause, { attempted: true }),
        );
    });

    it('gives every leaf callback its own context', async () => {
        expect.assertions(2);
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const cause = new Error('failed');
        const executor = createTransactionPlanExecutorWithConcurrentLeaves<{ id: string }>({
            executeTransactionMessage: (context, message) => {
                context.id = (message as TransactionMessage & TransactionMessageWithFeePayer & { id: string }).id;
                return Promise.reject(cause);
            },
        });

        const error = await executor(parallelTransactionPlan([messageA, messageB])).catch((error: unknown) => error);

        expect(isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN)).toBe(true);
        assertIsFailedToExecuteTransactionPlanError(error);
        expect(error.context.transactionPlanResult).toStrictEqual(
            parallelTransactionPlanResult([
                failedSingleTransactionPlanResult<{ id: string }>(messageA, cause, { id: 'A' }),
                failedSingleTransactionPlanResult<{ id: string }>(messageB, cause, { id: 'B' }),
            ]),
        );
    });

    it('keeps context properties that the callback stored but did not return', async () => {
        expect.assertions(1);
        const messageA = createMessage('A');
        const transactionA = createTransaction('A');
        const executor = createTransactionPlanExecutorWithConcurrentLeaves({
            executeTransactionMessage: context => {
                context.transaction = transactionA;
                return Promise.resolve({ signature: 'A' as Signature });
            },
        });

        const promise = executor(singleTransactionPlan(messageA));
        await expect(promise).resolves.toStrictEqual(
            successfulSingleTransactionPlanResult(messageA, {
                signature: 'A' as Signature,
                transaction: transactionA,
            }),
        );
    });

    it('prefers the returned context over the one stored on the context', async () => {
        expect.assertions(1);
        const messageA = createMessage('A');
        const executor = createTransactionPlanExecutorWithConcurrentLeaves({
            executeTransactionMessage: context => {
                context.signature = 'stale' as Signature;
                return Promise.resolve({ signature: 'A' as Signature });
            },
        });

        const promise = executor(singleTransactionPlan(messageA));
        await expect(promise).resolves.toStrictEqual(
            successfulSingleTransactionPlanResult(messageA, { signature: 'A' as Signature }),
        );
    });

    it('rejects transaction plans with an unknown kind', async () => {
        expect.assertions(1);
        const transactionPlan = { kind: 'unknown' } as unknown as TransactionPlan;
        const executor = createTransactionPlanExecutorWithConcurrentLeaves<TransactionPlanResultContext>({
            executeTransactionMessage: () => Promise.reject(new Error('not implemented')),
        });

        const error = await executor(transactionPlan).catch((error: unknown) => error);

        expect(isSolanaError(error, SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND)).toBe(true);
    });
});

describe('passthroughFailedTransactionPlanExecution', () => {
    it('returns the resolved result as-is', async () => {
        expect.assertions(1);
        const result = successfulSingleTransactionPlanResult(createMessage('A'), { signature: 'A' as Signature });
        const promise = Promise.resolve(result);
        await expect(passthroughFailedTransactionPlanExecution(promise)).resolves.toBe(result);
    });
    it('returns the result inside the rejected execution error', async () => {
        expect.assertions(1);
        const result = failedSingleTransactionPlanResult(
            createMessage('A'),
            new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
        );
        const promise = Promise.reject(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                transactionPlanResult: result,
            }),
        );
        await expect(passthroughFailedTransactionPlanExecution(promise)).resolves.toBe(result);
    });
    it('does not catch errors other than failed execution errors', async () => {
        expect.assertions(1);
        const promise = Promise.reject(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED),
        );
        await expect(passthroughFailedTransactionPlanExecution(promise)).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED),
        );
    });
});
