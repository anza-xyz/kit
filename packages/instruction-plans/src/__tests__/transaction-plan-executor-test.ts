import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT,
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN,
    SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED,
    SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE,
    SolanaError,
} from '@solana/errors';
import { Signature } from '@solana/keys';
import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';

import {
    canceledSingleTransactionPlanResult,
    createTransactionPlanExecutor,
    failedSingleTransactionPlanResult,
    nonDivisibleSequentialTransactionPlan,
    parallelTransactionPlan,
    parallelTransactionPlanResult,
    passthroughFailedTransactionPlanExecution,
    sequentialTransactionPlan,
    sequentialTransactionPlanResult,
    singleTransactionPlan,
    successfulSingleTransactionPlanResult,
    successfulSingleTransactionPlanResultFromTransaction,
    TransactionPlanResult,
} from '../index';
import { createMessage, createTransaction, FOREVER_PROMISE } from './__setup__';

jest.useFakeTimers();

async function expectFailedToExecute(
    promise: Promise<TransactionPlanResult>,
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

function forwardId(_: unknown, message: TransactionMessage & TransactionMessageWithFeePayer) {
    return Promise.resolve(
        createTransaction((message as TransactionMessage & TransactionMessageWithFeePayer & { id: string }).id),
    );
}

describe('createTransactionPlanExecutor', () => {
    describe('single scenarios', () => {
        it('successfully executes a single transaction message', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executeTransactionMessage = jest.fn().mockResolvedValue(transactionA);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
            );
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, expect.any(Object), messageA, {
                abortSignal: undefined,
            });
        });

        it('passes the abort signal to the `executeTransactionMessage` function', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const executeTransactionMessage = jest.fn().mockResolvedValue(createTransaction('A'));
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            await executor(singleTransactionPlan(messageA), { abortSignal });
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, expect.any(Object), messageA, { abortSignal });
        });

        it('uses the returned signature for the successful context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: () => Promise.resolve('A' as Signature),
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult(messageA, { signature: 'A' as Signature }),
            );
        });

        it('uses the signature from the returned transaction for the successful context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: () => Promise.resolve(transactionA),
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult(messageA, {
                    signature: 'A' as Signature,
                    transaction: transactionA,
                }),
            );
        });

        it('override any set signature with the returned signature', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: context => {
                    context.signature = 'CONTEXT_SIGNATURE' as Signature;
                    return Promise.resolve('RETURNED_SIGNATURE' as Signature);
                },
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult(messageA, { signature: 'RETURNED_SIGNATURE' as Signature }),
            );
        });

        it('override any set signature with the signature of the returned transaction', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: context => {
                    context.signature = 'CONTEXT_SIGNATURE' as Signature;
                    return Promise.resolve(transactionA);
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

        it('override any set transaction with the returned transaction', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: context => {
                    context.transaction = createTransaction('B');
                    return Promise.resolve(transactionA);
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

        it('stores the base context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executor = createTransactionPlanExecutor({
                executeTransactionMessage: (context, _) => {
                    context.message = createMessage('NEW A');
                    context.transaction = transactionA;
                    context.signature = 'A' as Signature;
                    return Promise.resolve(transactionA);
                },
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
            const executor = createTransactionPlanExecutor<{ custom: string }>({
                executeTransactionMessage: context => {
                    context.custom = 'custom value';
                    context.message = messageB;
                    return Promise.resolve('A' as Signature);
                },
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
            const executor = createTransactionPlanExecutor<{ afterFailure: string; beforeFailure: string }>({
                executeTransactionMessage: async context => {
                    context.beforeFailure = 'before failure';
                    context.message = messageB;
                    context.transaction = transactionA;
                    context.signature = 'B' as Signature;
                    throwCause();
                    context.afterFailure = 'after failure';
                    return await Promise.resolve('C' as Signature);
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

        it('adds the signature to a failed context if a transaction is present', async () => {
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
                    return await Promise.resolve(transactionA);
                },
            });

            const promise = executor(singleTransactionPlan(messageA));
            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: failedSingleTransactionPlanResult(messageA, cause, {
                        signature: 'A' as Signature,
                        transaction: transactionA,
                    }),
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
                    successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A')),
                    successfulSingleTransactionPlanResultFromTransaction(messageB, createTransaction('B')),
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
            const executor = createTransactionPlanExecutor<{ custom: string }>({
                executeTransactionMessage: (context, message) => {
                    const id = (message as TransactionMessage & TransactionMessageWithFeePayer & { id: string }).id;
                    context.custom = 'Message ' + id;
                    return forwardId(context, message);
                },
            });

            const promise = executor(sequentialTransactionPlan([messageA, messageB]));
            await expect(promise).resolves.toStrictEqual(
                sequentialTransactionPlanResult([
                    successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A'), {
                        custom: 'Message A',
                    }),
                    successfulSingleTransactionPlanResultFromTransaction(messageB, createTransaction('B'), {
                        custom: 'Message B',
                    }),
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
                        successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A')),
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
                        successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A')),
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
                    successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A')),
                    successfulSingleTransactionPlanResultFromTransaction(messageB, createTransaction('B')),
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
            const executor = createTransactionPlanExecutor<{ custom: string }>({
                executeTransactionMessage: (context, message) => {
                    const id = (message as TransactionMessage & TransactionMessageWithFeePayer & { id: string }).id;
                    context.custom = 'Message ' + id;
                    return forwardId(context, message);
                },
            });

            const promise = executor(parallelTransactionPlan([messageA, messageB]));
            await expect(promise).resolves.toStrictEqual(
                parallelTransactionPlanResult([
                    successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A'), {
                        custom: 'Message A',
                    }),
                    successfulSingleTransactionPlanResultFromTransaction(messageB, createTransaction('B'), {
                        custom: 'Message B',
                    }),
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
                        successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A')),
                        failedSingleTransactionPlanResult(messageB, cause),
                        successfulSingleTransactionPlanResultFromTransaction(messageC, createTransaction('C')),
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
                        successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A')),
                        failedSingleTransactionPlanResult(messageB, cause),
                        successfulSingleTransactionPlanResultFromTransaction(messageC, createTransaction('C')),
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
                        successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A')),
                        parallelTransactionPlanResult([
                            successfulSingleTransactionPlanResultFromTransaction(messageB, createTransaction('B')),
                            successfulSingleTransactionPlanResultFromTransaction(messageC, createTransaction('C')),
                        ]),
                        successfulSingleTransactionPlanResultFromTransaction(messageD, createTransaction('D')),
                    ]),
                    successfulSingleTransactionPlanResultFromTransaction(messageE, createTransaction('E')),
                    sequentialTransactionPlanResult([
                        successfulSingleTransactionPlanResultFromTransaction(messageF, createTransaction('F')),
                        successfulSingleTransactionPlanResultFromTransaction(messageG, createTransaction('G')),
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
                            successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A')),
                            parallelTransactionPlanResult([
                                successfulSingleTransactionPlanResultFromTransaction(messageB, createTransaction('B')),
                                failedSingleTransactionPlanResult(messageC, cause),
                            ]),
                            canceledSingleTransactionPlanResult(messageD),
                        ]),
                        successfulSingleTransactionPlanResultFromTransaction(messageE, createTransaction('E')),
                        sequentialTransactionPlanResult([
                            successfulSingleTransactionPlanResultFromTransaction(messageF, createTransaction('F')),
                            successfulSingleTransactionPlanResultFromTransaction(messageG, createTransaction('G')),
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
                            successfulSingleTransactionPlanResultFromTransaction(messageA, createTransaction('A')),
                            parallelTransactionPlanResult([
                                successfulSingleTransactionPlanResultFromTransaction(messageB, createTransaction('B')),
                                failedSingleTransactionPlanResult(messageC, cause),
                            ]),
                            canceledSingleTransactionPlanResult(messageD),
                        ]),
                        successfulSingleTransactionPlanResultFromTransaction(messageE, createTransaction('E')),
                        sequentialTransactionPlanResult([
                            successfulSingleTransactionPlanResultFromTransaction(messageF, createTransaction('F')),
                            successfulSingleTransactionPlanResultFromTransaction(messageG, createTransaction('G')),
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

describe('passthroughFailedTransactionPlanExecution', () => {
    it('returns the resolved result as-is', async () => {
        expect.assertions(1);
        const result = successfulSingleTransactionPlanResultFromTransaction(createMessage('A'), createTransaction('A'));
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
