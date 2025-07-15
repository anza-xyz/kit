import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT,
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN,
    SolanaError,
} from '@solana/errors';

import {
    nonDivisibleSequentialTransactionPlan,
    parallelTransactionPlan,
    sequentialTransactionPlan,
    singleTransactionPlan,
} from '../transaction-plan';
import { createTransactionPlanExecutor } from '../transaction-plan-executor';
import {
    canceledSingleTransactionPlanResult,
    failedSingleTransactionPlanResult,
    nonDivisibleSequentialTransactionPlanResult,
    parallelTransactionPlanResult,
    sequentialTransactionPlanResult,
    successfulSingleTransactionPlanResult,
    TransactionPlanResult,
} from '../transaction-plan-result';
import { createMessage, createTransaction, FOREVER_PROMISE } from './__setup__';

jest.useFakeTimers();

async function expectFailedToExecute(
    promise: Promise<TransactionPlanResult>,
    error: SolanaError<typeof SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN>,
): Promise<void> {
    const transactionPlanResult = error.context.transactionPlanResult;
    await expect(promise).rejects.toThrow(error);
    // This second expectation is necessary since `toThrow` will only check the
    // error message and `transactionPlanResult` is not part of the message.
    await expect(promise).rejects.toThrow(
        expect.objectContaining({ context: expect.objectContaining({ transactionPlanResult }) }),
    );
}

function forwardId(message: { id: string }) {
    return Promise.resolve({ transaction: createTransaction(message.id) });
}

describe('createTransactionPlanExecutor', () => {
    describe('single scenarios', () => {
        it('successfully executes a single transaction message', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executeTransactionMessage = jest.fn().mockResolvedValue({ transaction: transactionA });
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(successfulSingleTransactionPlanResult(messageA, transactionA));
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, messageA, { abortSignal: undefined });
        });

        it('passes the abort signal to the `executeTransactionMessage` function', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const executeTransactionMessage = jest.fn().mockResolvedValue({ transaction: createTransaction('A') });
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            await executor(singleTransactionPlan(messageA), { abortSignal });
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, messageA, { abortSignal });
        });

        it('executes a single transaction message with custom context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const transactionA = createTransaction('A');
            const executeTransactionMessage = jest.fn().mockResolvedValue({
                context: { custom: 'context' },
                transaction: transactionA,
            });
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(singleTransactionPlan(messageA));
            await expect(promise).resolves.toStrictEqual(
                successfulSingleTransactionPlanResult(messageA, transactionA, { custom: 'context' }),
            );
        });

        it('fails to execute a single transaction message when the executor function rejects', async () => {
            expect.assertions(2);
            const messageA = createMessage('A');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const executeTransactionMessage = jest.fn().mockRejectedValue(cause);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

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
            const cause = new Error('Aborted during execution') as SolanaError;
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
            const cause = new Error('Aborted before execution') as SolanaError;
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
                    successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
                    successfulSingleTransactionPlanResult(messageB, createTransaction('B')),
                ]),
            );

            expect(executeTransactionMessage).toHaveBeenCalledTimes(2);
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, messageA, { abortSignal: undefined });
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(2, messageB, { abortSignal: undefined });
        });

        it('successfully executes a non-divisible sequential transaction plan', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(nonDivisibleSequentialTransactionPlan([messageA, messageB]));
            await expect(promise).resolves.toStrictEqual(
                nonDivisibleSequentialTransactionPlanResult([
                    successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
                    successfulSingleTransactionPlanResult(messageB, createTransaction('B')),
                ]),
            );
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
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, messageA, { abortSignal });
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(2, messageB, { abortSignal });
        });

        it('executes a sequential transaction plan with custom context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const executeTransactionMessage = jest.fn().mockImplementation((message: { id: string }) => {
                return Promise.resolve({
                    context: { custom: 'context' },
                    transaction: createTransaction(message.id),
                });
            });
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(sequentialTransactionPlan([messageA, messageB]));
            await expect(promise).resolves.toStrictEqual(
                sequentialTransactionPlanResult([
                    successfulSingleTransactionPlanResult(messageA, createTransaction('A'), { custom: 'context' }),
                    successfulSingleTransactionPlanResult(messageB, createTransaction('B'), { custom: 'context' }),
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
                        successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
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
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, messageA, { abortSignal: undefined });
        });

        it('can abort sequential transaction plans', async () => {
            expect.assertions(6);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const cause = new Error('Aborted during execution') as SolanaError;
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
                        successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
                        failedSingleTransactionPlanResult(messageB, cause),
                        canceledSingleTransactionPlanResult(messageC),
                    ]),
                }),
            );

            expect(executeTransactionMessage).toHaveBeenCalledTimes(2);
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(1, messageA, { abortSignal });
            expect(executeTransactionMessage).toHaveBeenNthCalledWith(2, messageB, { abortSignal });
            expect(executeTransactionMessage).not.toHaveBeenCalledWith(messageC, { abortSignal });
        });

        it('can abort sequential transaction plans before execution', async () => {
            expect.assertions(3);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const abortController = new AbortController();
            const abortSignal = abortController.signal;
            const cause = new Error('Aborted before execution') as SolanaError;
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
                    successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
                    successfulSingleTransactionPlanResult(messageB, createTransaction('B')),
                ]),
            );

            expect(executeTransactionMessage).toHaveBeenCalledTimes(2);
            expect(executeTransactionMessage).toHaveBeenCalledWith(messageA, { abortSignal: undefined });
            expect(executeTransactionMessage).toHaveBeenCalledWith(messageB, { abortSignal: undefined });
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
            expect(executeTransactionMessage).toHaveBeenCalledWith(messageA, { abortSignal });
            expect(executeTransactionMessage).toHaveBeenCalledWith(messageB, { abortSignal });
        });

        it('executes a parallel transaction plan with custom context', async () => {
            expect.assertions(1);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const executeTransactionMessage = jest.fn().mockImplementation((message: { id: string }) => {
                return Promise.resolve({
                    context: { custom: 'context' },
                    transaction: createTransaction(message.id),
                });
            });
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(parallelTransactionPlan([messageA, messageB]));
            await expect(promise).resolves.toStrictEqual(
                parallelTransactionPlanResult([
                    successfulSingleTransactionPlanResult(messageA, createTransaction('A'), { custom: 'context' }),
                    successfulSingleTransactionPlanResult(messageB, createTransaction('B'), { custom: 'context' }),
                ]),
            );
        });

        it('partially fails to execute a parallel transaction plan when the executor function rejects', async () => {
            expect.assertions(3);
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const cause = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT, { index: 0 });
            const executeTransactionMessage = jest.fn().mockImplementation((message: { id: string }) => {
                // eslint-disable-next-line jest/no-conditional-in-test
                return message.id === 'B' ? Promise.reject(cause) : forwardId(message);
            });
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(parallelTransactionPlan([messageA, messageB, messageC]));
            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: parallelTransactionPlanResult([
                        successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
                        failedSingleTransactionPlanResult(messageB, cause),
                        successfulSingleTransactionPlanResult(messageC, createTransaction('C')),
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
            const cause = new Error('Aborted during execution') as SolanaError;
            const executeTransactionMessage = jest.fn().mockImplementation((message: { id: string }) => {
                // eslint-disable-next-line jest/no-conditional-in-test
                return message.id === 'B' ? FOREVER_PROMISE : forwardId(message);
            });
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(parallelTransactionPlan([messageA, messageB, messageC]), { abortSignal });
            await jest.runAllTimersAsync();
            abortController.abort(cause);

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: parallelTransactionPlanResult([
                        successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
                        failedSingleTransactionPlanResult(messageB, cause),
                        successfulSingleTransactionPlanResult(messageC, createTransaction('C')),
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
            const cause = new Error('Aborted before execution') as SolanaError;
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
                    nonDivisibleSequentialTransactionPlan([messageF, messageG]),
                ]),
            );

            await expect(promise).resolves.toStrictEqual(
                parallelTransactionPlanResult([
                    sequentialTransactionPlanResult([
                        successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
                        parallelTransactionPlanResult([
                            successfulSingleTransactionPlanResult(messageB, createTransaction('B')),
                            successfulSingleTransactionPlanResult(messageC, createTransaction('C')),
                        ]),
                        successfulSingleTransactionPlanResult(messageD, createTransaction('D')),
                    ]),
                    successfulSingleTransactionPlanResult(messageE, createTransaction('E')),
                    nonDivisibleSequentialTransactionPlanResult([
                        successfulSingleTransactionPlanResult(messageF, createTransaction('F')),
                        successfulSingleTransactionPlanResult(messageG, createTransaction('G')),
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
            const executeTransactionMessage = jest.fn().mockImplementation((message: { id: string }) => {
                // eslint-disable-next-line jest/no-conditional-in-test
                return message.id === 'C' ? Promise.reject(cause) : forwardId(message);
            });
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(
                parallelTransactionPlan([
                    sequentialTransactionPlan([messageA, parallelTransactionPlan([messageB, messageC]), messageD]),
                    messageE,
                    nonDivisibleSequentialTransactionPlan([messageF, messageG]),
                ]),
            );

            await expectFailedToExecute(
                promise,
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN, {
                    cause,
                    transactionPlanResult: parallelTransactionPlanResult([
                        sequentialTransactionPlanResult([
                            successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
                            parallelTransactionPlanResult([
                                successfulSingleTransactionPlanResult(messageB, createTransaction('B')),
                                failedSingleTransactionPlanResult(messageC, cause),
                            ]),
                            canceledSingleTransactionPlanResult(messageD),
                        ]),
                        successfulSingleTransactionPlanResult(messageE, createTransaction('E')),
                        nonDivisibleSequentialTransactionPlanResult([
                            successfulSingleTransactionPlanResult(messageF, createTransaction('F')),
                            successfulSingleTransactionPlanResult(messageG, createTransaction('G')),
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
            const cause = new Error('Aborted during execution') as SolanaError;
            const executeTransactionMessage = jest.fn().mockImplementation((message: { id: string }) => {
                // eslint-disable-next-line jest/no-conditional-in-test
                return message.id === 'C' ? FOREVER_PROMISE : forwardId(message);
            });
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            const promise = executor(
                parallelTransactionPlan([
                    sequentialTransactionPlan([messageA, parallelTransactionPlan([messageB, messageC]), messageD]),
                    messageE,
                    nonDivisibleSequentialTransactionPlan([messageF, messageG]),
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
                            successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
                            parallelTransactionPlanResult([
                                successfulSingleTransactionPlanResult(messageB, createTransaction('B')),
                                failedSingleTransactionPlanResult(messageC, cause),
                            ]),
                            canceledSingleTransactionPlanResult(messageD),
                        ]),
                        successfulSingleTransactionPlanResult(messageE, createTransaction('E')),
                        nonDivisibleSequentialTransactionPlanResult([
                            successfulSingleTransactionPlanResult(messageF, createTransaction('F')),
                            successfulSingleTransactionPlanResult(messageG, createTransaction('G')),
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
            const cause = new Error('Aborted during execution') as SolanaError;
            const executeTransactionMessage = jest.fn().mockImplementation(forwardId);
            const executor = createTransactionPlanExecutor({ executeTransactionMessage });

            abortController.abort(cause);
            const promise = executor(
                parallelTransactionPlan([
                    sequentialTransactionPlan([messageA, parallelTransactionPlan([messageB, messageC]), messageD]),
                    messageE,
                    nonDivisibleSequentialTransactionPlan([messageF, messageG]),
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
                        nonDivisibleSequentialTransactionPlanResult([
                            canceledSingleTransactionPlanResult(messageF),
                            canceledSingleTransactionPlanResult(messageG),
                        ]),
                    ]),
                }),
            );
        });
    });
});
