import {
    type RpcSimulateTransactionResult,
    SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION,
    SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS,
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
    SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE,
    SolanaError,
} from '@solana/errors';
import { Signature } from '@solana/keys';

import {
    canceledSingleTransactionPlanResult,
    createFailedToExecuteTransactionPlanError,
    createFailedToSendTransactionError,
    createFailedToSendTransactionsError,
    failedSingleTransactionPlanResult,
    parallelTransactionPlanResult,
    sequentialTransactionPlanResult,
    successfulSingleTransactionPlanResult,
} from '../index';
import { createMessage } from './__setup__';

const preflightContext: Omit<RpcSimulateTransactionResult, 'err'> = {
    accounts: null,
    loadedAccountsDataSize: null,
    logs: ['Program log: Instruction: Transfer', 'Program failed: insufficient funds'],
    replacementBlockhash: null,
    returnData: null,
    unitsConsumed: null,
};

const preflightContextWithoutLogs: Omit<RpcSimulateTransactionResult, 'err'> = {
    accounts: null,
    loadedAccountsDataSize: null,
    logs: null,
    replacementBlockhash: null,
    returnData: null,
    unitsConsumed: null,
};

function createPreflightError(
    causeError: Error,
    context: Omit<RpcSimulateTransactionResult, 'err'>,
): SolanaError<typeof SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE> {
    return new SolanaError(SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE, {
        ...context,
        cause: causeError,
    });
}

describe('createFailedToSendTransactionError', () => {
    describe('given a failed result with a preflight error', () => {
        it('unwraps the preflight error and sets the cause to the inner error', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, preflightContext);
            const result = failedSingleTransactionPlanResult(createMessage('A'), preflightError);
            const error = createFailedToSendTransactionError(result);
            expect(error.cause).toBe(innerError);
        });

        it('sets preflightData from the preflight error context', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, preflightContext);
            const result = failedSingleTransactionPlanResult(createMessage('A'), preflightError);
            const error = createFailedToSendTransactionError(result);
            expect(error.context.preflightData).toEqual(preflightContext);
        });

        it('sets logs as a shortcut to preflightData.logs', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, preflightContext);
            const result = failedSingleTransactionPlanResult(createMessage('A'), preflightError);
            const error = createFailedToSendTransactionError(result);
            expect(error.context.logs).toEqual(preflightContext.logs);
            expect(error.context.logs).toEqual(error.context.preflightData?.logs);
        });

        it('sets logs to undefined when preflight logs are null', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, preflightContextWithoutLogs);
            const result = failedSingleTransactionPlanResult(createMessage('A'), preflightError);
            const error = createFailedToSendTransactionError(result);
            expect(error.context.logs).toBeUndefined();
        });

        it('includes (preflight) in the causeMessage', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, preflightContext);
            const result = failedSingleTransactionPlanResult(createMessage('A'), preflightError);
            const error = createFailedToSendTransactionError(result);
            expect(error.context.causeMessage).toContain('(preflight)');
        });

        it('produces the expected error message', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, { ...preflightContext, logs: [] });
            const result = failedSingleTransactionPlanResult(createMessage('A'), preflightError);
            const error = createFailedToSendTransactionError(result);
            expect(error.message).toBe(`Failed to send transaction (preflight): ${innerError.message}`);
        });
    });

    describe('given a failed result without a preflight error', () => {
        it('uses the error directly as the cause', () => {
            const plainError = new Error('Connection refused');
            const result = failedSingleTransactionPlanResult(createMessage('A'), plainError);
            const error = createFailedToSendTransactionError(result);
            expect(error.cause).toBe(plainError);
        });

        it('sets preflightData to undefined', () => {
            const plainError = new Error('Connection refused');
            const result = failedSingleTransactionPlanResult(createMessage('A'), plainError);
            const error = createFailedToSendTransactionError(result);
            expect(error.context.preflightData).toBeUndefined();
        });

        it('sets logs to undefined', () => {
            const plainError = new Error('Connection refused');
            const result = failedSingleTransactionPlanResult(createMessage('A'), plainError);
            const error = createFailedToSendTransactionError(result);
            expect(error.context.logs).toBeUndefined();
        });

        it('produces the expected error message without an indicator', () => {
            const plainError = new Error('Connection refused');
            const result = failedSingleTransactionPlanResult(createMessage('A'), plainError);
            const error = createFailedToSendTransactionError(result);
            expect(error.message).toBe('Failed to send transaction: Connection refused');
        });
    });

    describe('given a failed result with a signature in the context', () => {
        it('includes the full signature in the causeMessage', () => {
            const plainError = new Error('Transaction failed');
            const signature =
                '5wHu1qwD7q5ifaN5nwdcDQNbHUiCfnzJ6vaR98NLugS1CiVfCZLMGmmFaKCAVfPTFE5KPMhSaZaLo2v4xXSHVJk' as Signature;
            const result = failedSingleTransactionPlanResult(createMessage('A'), plainError, { signature });
            const error = createFailedToSendTransactionError(result);
            expect(error.message).toBe(`Failed to send transaction (${signature}): Transaction failed`);
        });
    });

    describe('given a failed result with a compute-limit simulation error', () => {
        it('unwraps the simulation error', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const simulationError = new SolanaError(
                SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
                { ...preflightContext, cause: innerError },
            );
            const result = failedSingleTransactionPlanResult(createMessage('A'), simulationError);
            const error = createFailedToSendTransactionError(result);
            expect(error.cause).toBe(innerError);
        });

        it('sets preflightData from the simulation error context', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const simulationError = new SolanaError(
                SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
                { ...preflightContext, cause: innerError },
            );
            const result = failedSingleTransactionPlanResult(createMessage('A'), simulationError);
            const error = createFailedToSendTransactionError(result);
            expect(error.context.preflightData).toEqual(preflightContext);
        });

        it('sets logs from the simulation error context', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const simulationError = new SolanaError(
                SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
                { ...preflightContext, cause: innerError },
            );
            const result = failedSingleTransactionPlanResult(createMessage('A'), simulationError);
            const error = createFailedToSendTransactionError(result);
            expect(error.context.logs).toEqual(preflightContext.logs);
        });
    });

    describe('log snippet in error message', () => {
        it('appends the last 8 log lines when there are more than 8 logs', () => {
            const logs = Array.from({ length: 12 }, (_, i) => `Log line ${i + 1}`);
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, { ...preflightContext, logs });
            const result = failedSingleTransactionPlanResult(createMessage('A'), preflightError);
            const error = createFailedToSendTransactionError(result);
            expect(error.message).toBe(
                `Failed to send transaction (preflight): ${innerError.message}\n\n` +
                    'Logs (last 8 of 12):\n' +
                    '  > Log line 5\n' +
                    '  > Log line 6\n' +
                    '  > Log line 7\n' +
                    '  > Log line 8\n' +
                    '  > Log line 9\n' +
                    '  > Log line 10\n' +
                    '  > Log line 11\n' +
                    '  > Log line 12\n',
            );
        });

        it('appends all log lines when there are 8 or fewer logs', () => {
            const logs = ['Log A', 'Log B', 'Log C'];
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, { ...preflightContext, logs });
            const result = failedSingleTransactionPlanResult(createMessage('A'), preflightError);
            const error = createFailedToSendTransactionError(result);
            expect(error.message).toBe(
                `Failed to send transaction (preflight): ${innerError.message}\n\n` +
                    'Logs:\n' +
                    '  > Log A\n' +
                    '  > Log B\n' +
                    '  > Log C\n',
            );
        });

        it('does not append logs when logs are undefined', () => {
            const plainError = new Error('Connection refused');
            const result = failedSingleTransactionPlanResult(createMessage('A'), plainError);
            const error = createFailedToSendTransactionError(result);
            expect(error.message).toBe('Failed to send transaction: Connection refused');
        });

        it('does not append logs when preflight logs are null', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, preflightContextWithoutLogs);
            const result = failedSingleTransactionPlanResult(createMessage('A'), preflightError);
            const error = createFailedToSendTransactionError(result);
            expect(error.message).toBe(`Failed to send transaction (preflight): ${innerError.message}`);
        });

        it('does not append logs when logs array is empty', () => {
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, { ...preflightContext, logs: [] });
            const result = failedSingleTransactionPlanResult(createMessage('A'), preflightError);
            const error = createFailedToSendTransactionError(result);
            expect(error.message).toBe(`Failed to send transaction (preflight): ${innerError.message}`);
        });
    });

    describe('given a canceled result with an abort reason', () => {
        it('sets the cause to the abort reason', () => {
            const abortReason = new Error('User canceled');
            const result = canceledSingleTransactionPlanResult(createMessage('A'));
            const error = createFailedToSendTransactionError(result, abortReason);
            expect(error.cause).toBe(abortReason);
        });

        it('includes the abort reason in the causeMessage', () => {
            const abortReason = new Error('User canceled');
            const result = canceledSingleTransactionPlanResult(createMessage('A'));
            const error = createFailedToSendTransactionError(result, abortReason);
            expect(error.message).toBe('Failed to send transaction. Canceled with abort reason: Error: User canceled');
        });

        it('does not set preflightData or logs', () => {
            const result = canceledSingleTransactionPlanResult(createMessage('A'));
            const error = createFailedToSendTransactionError(result, new Error('abort'));
            expect(error.context.preflightData).toBeUndefined();
            expect(error.context.logs).toBeUndefined();
        });
    });

    describe('given a canceled result without an abort reason', () => {
        it('produces the expected error message', () => {
            const result = canceledSingleTransactionPlanResult(createMessage('A'));
            const error = createFailedToSendTransactionError(result);
            expect(error.message).toBe('Failed to send transaction: Canceled');
        });

        it('sets the cause to undefined', () => {
            const result = canceledSingleTransactionPlanResult(createMessage('A'));
            const error = createFailedToSendTransactionError(result);
            expect(error.cause).toBeUndefined();
        });
    });

    it('sets transactionPlanResult as a non-enumerable property', () => {
        const plainError = new Error('fail');
        const result = failedSingleTransactionPlanResult(createMessage('A'), plainError);
        const error = createFailedToSendTransactionError(result);
        expect(error.context.transactionPlanResult).toBe(result);
        expect(Object.keys(error.context)).not.toContain('transactionPlanResult');
    });

    it('has the correct error code', () => {
        const plainError = new Error('fail');
        const result = failedSingleTransactionPlanResult(createMessage('A'), plainError);
        const error = createFailedToSendTransactionError(result);
        expect(error.context.__code).toBe(SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION);
    });
});

describe('createFailedToSendTransactionsError', () => {
    describe('given a result with mixed failed, canceled, and successful transactions', () => {
        it('only includes failed transactions in failedTransactions', () => {
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const errorB = new Error('B failed');
            const result = sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(messageA, {
                    signature: '11111111111111111111111111111111111111111111' as Signature,
                }),
                failedSingleTransactionPlanResult(messageB, errorB),
                canceledSingleTransactionPlanResult(messageC),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.context.failedTransactions).toHaveLength(1);
        });

        it('uses 0-based indices from the flattened result array', () => {
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const errorB = new Error('B failed');
            const result = sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(messageA, {
                    signature: '11111111111111111111111111111111111111111111' as Signature,
                }),
                failedSingleTransactionPlanResult(messageB, errorB),
                canceledSingleTransactionPlanResult(messageC),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.context.failedTransactions[0].index).toBe(1);
        });

        it('produces the expected error message', () => {
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const errorA = new Error('A failed');
            const errorB = new Error('B failed');
            const result = sequentialTransactionPlanResult([
                failedSingleTransactionPlanResult(messageA, errorA),
                failedSingleTransactionPlanResult(messageB, errorB),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.message).toBe('Failed to send transactions.\n[Tx #1] A failed\n[Tx #2] B failed\n');
        });

        it('sets the cause to the error when there is exactly one failure', () => {
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const errorA = new Error('A failed');
            const result = sequentialTransactionPlanResult([
                failedSingleTransactionPlanResult(messageA, errorA),
                canceledSingleTransactionPlanResult(messageB),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.cause).toBe(errorA);
        });

        it('does not set the cause when there are multiple failures', () => {
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const errorA = new Error('A failed');
            const errorB = new Error('B failed');
            const result = sequentialTransactionPlanResult([
                failedSingleTransactionPlanResult(messageA, errorA),
                failedSingleTransactionPlanResult(messageB, errorB),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.cause).toBeUndefined();
        });
    });

    describe('given failures with preflight errors', () => {
        it('includes (preflight) indicator in causeMessages', () => {
            const messageA = createMessage('A');
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, preflightContext);
            const result = sequentialTransactionPlanResult([
                failedSingleTransactionPlanResult(messageA, preflightError),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.context.causeMessages).toContain('(preflight)');
        });

        it('unwraps the preflight error in failedTransactions entries', () => {
            const messageA = createMessage('A');
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, preflightContext);
            const result = sequentialTransactionPlanResult([
                failedSingleTransactionPlanResult(messageA, preflightError),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.context.failedTransactions[0].error).toBe(innerError);
            expect(error.context.failedTransactions[0].preflightData).toEqual(preflightContext);
        });

        it('sets logs on failedTransactions entries', () => {
            const messageA = createMessage('A');
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, preflightContext);
            const result = sequentialTransactionPlanResult([
                failedSingleTransactionPlanResult(messageA, preflightError),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.context.failedTransactions[0].logs).toEqual(preflightContext.logs);
        });
    });

    describe('given failures with signatures in the context', () => {
        it('includes the signature in causeMessages', () => {
            const messageA = createMessage('A');
            const signature =
                '5wHu1qwD7q5ifaN5nwdcDQNbHUiCfnzJ6vaR98NLugS1CiVfCZLMGmmFaKCAVfPTFE5KPMhSaZaLo2v4xXSHVJk' as Signature;
            const plainError = new Error('Transaction failed');
            const result = sequentialTransactionPlanResult([
                failedSingleTransactionPlanResult(messageA, plainError, { signature }),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.message).toBe(`Failed to send transactions.\n[Tx #1 (${signature})] Transaction failed\n`);
        });
    });

    describe('log snippet in error message', () => {
        it('appends logs when there is exactly one failed transaction with logs', () => {
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, preflightContext);
            const result = sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(messageA, {
                    signature: '11111111111111111111111111111111111111111111' as Signature,
                }),
                failedSingleTransactionPlanResult(messageB, preflightError),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.message).toBe(
                `Failed to send transactions.\n[Tx #2 (preflight)] ${innerError.message}\n\n` +
                    'Logs:\n' +
                    '  > Program log: Instruction: Transfer\n' +
                    '  > Program failed: insufficient funds\n',
            );
        });

        it('appends the last 8 log lines with truncation indicator when there are more than 8 logs', () => {
            const logs = Array.from({ length: 10 }, (_, i) => `Log line ${i + 1}`);
            const messageA = createMessage('A');
            const innerError = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightError = createPreflightError(innerError, { ...preflightContext, logs });
            const result = sequentialTransactionPlanResult([
                failedSingleTransactionPlanResult(messageA, preflightError),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.message).toBe(
                `Failed to send transactions.\n[Tx #1 (preflight)] ${innerError.message}\n\n` +
                    'Logs (last 8 of 10):\n' +
                    '  > Log line 3\n' +
                    '  > Log line 4\n' +
                    '  > Log line 5\n' +
                    '  > Log line 6\n' +
                    '  > Log line 7\n' +
                    '  > Log line 8\n' +
                    '  > Log line 9\n' +
                    '  > Log line 10\n',
            );
        });

        it('does not append logs when there are multiple failed transactions', () => {
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const innerErrorA = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightErrorA = createPreflightError(innerErrorA, preflightContext);
            const innerErrorB = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
            const preflightErrorB = createPreflightError(innerErrorB, preflightContext);
            const result = sequentialTransactionPlanResult([
                failedSingleTransactionPlanResult(messageA, preflightErrorA),
                failedSingleTransactionPlanResult(messageB, preflightErrorB),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.message).toBe(
                `Failed to send transactions.\n[Tx #1 (preflight)] ${innerErrorA.message}\n` +
                    `[Tx #2 (preflight)] ${innerErrorB.message}\n`,
            );
        });

        it('does not append logs when the single failed transaction has no logs', () => {
            const messageA = createMessage('A');
            const plainError = new Error('Connection refused');
            const result = sequentialTransactionPlanResult([failedSingleTransactionPlanResult(messageA, plainError)]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.message).toBe('Failed to send transactions.\n[Tx #1] Connection refused\n');
        });
    });

    describe('given all canceled results with an abort reason', () => {
        it('produces a single-line canceled message', () => {
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const abortReason = new Error('User aborted');
            const result = sequentialTransactionPlanResult([
                canceledSingleTransactionPlanResult(messageA),
                canceledSingleTransactionPlanResult(messageB),
            ]);
            const error = createFailedToSendTransactionsError(result, abortReason);
            expect(error.message).toBe(
                `Failed to send transactions. Canceled with abort reason: ${String(abortReason)}`,
            );
        });

        it('has an empty failedTransactions array', () => {
            const messageA = createMessage('A');
            const result = sequentialTransactionPlanResult([canceledSingleTransactionPlanResult(messageA)]);
            const error = createFailedToSendTransactionsError(result, new Error('abort'));
            expect(error.context.failedTransactions).toHaveLength(0);
        });

        it('sets the cause to the abort reason', () => {
            const messageA = createMessage('A');
            const abortReason = new Error('User aborted');
            const result = sequentialTransactionPlanResult([canceledSingleTransactionPlanResult(messageA)]);
            const error = createFailedToSendTransactionsError(result, abortReason);
            expect(error.cause).toBe(abortReason);
        });
    });

    describe('given all canceled results without an abort reason', () => {
        it('produces a single-line canceled message', () => {
            const messageA = createMessage('A');
            const result = sequentialTransactionPlanResult([canceledSingleTransactionPlanResult(messageA)]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.message).toBe('Failed to send transactions: Canceled');
        });
    });

    describe('given a complex nested result', () => {
        it('flattens the result tree and uses correct indices', () => {
            const messageA = createMessage('A');
            const messageB = createMessage('B');
            const messageC = createMessage('C');
            const messageD = createMessage('D');
            const errorB = new Error('B failed');
            const errorD = new Error('D failed');
            const result = sequentialTransactionPlanResult([
                parallelTransactionPlanResult([
                    successfulSingleTransactionPlanResult(messageA, {
                        signature: '11111111111111111111111111111111111111111111' as Signature,
                    }),
                    failedSingleTransactionPlanResult(messageB, errorB),
                ]),
                sequentialTransactionPlanResult([
                    canceledSingleTransactionPlanResult(messageC),
                    failedSingleTransactionPlanResult(messageD, errorD),
                ]),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.context.failedTransactions).toHaveLength(2);
            // messageB is index 1 in the flattened [A, B, C, D] array
            expect(error.context.failedTransactions[0].index).toBe(1);
            // messageD is index 3 in the flattened [A, B, C, D] array
            expect(error.context.failedTransactions[1].index).toBe(3);
        });

        it('produces the expected error message with varied failure indicators', () => {
            const sigB =
                '2RocoT4bGn3GDCCkwBmpipjYHP1RWdoSxVUvMBqRTMFCnmFi2VoSuQhRYoP69NDPH8FPr4a3gH6JkJBJGP2DX2i' as Signature;
            const sigD =
                '5wHu1qwD7q5ifaN5nwdcDQNbHUiCfnzJ6vaR98NLugS1CiVfCZLMGmmFaKCAVfPTFE5KPMhSaZaLo2v4xXSHVJk' as Signature;
            // Flattened: [A(ok), B(preflight+sig), C(canceled), D(sig only), E(ok), F(preflight), G(plain), H(canceled)]
            const result = sequentialTransactionPlanResult([
                parallelTransactionPlanResult([
                    successfulSingleTransactionPlanResult(createMessage('A'), {
                        signature: '11111111111111111111111111111111111111111111' as Signature,
                    }),
                    // Tx #2: preflight error with signature — should show (preflight)
                    failedSingleTransactionPlanResult(
                        createMessage('B'),
                        createPreflightError(new Error('B failed'), preflightContext),
                        { signature: sigB },
                    ),
                ]),
                canceledSingleTransactionPlanResult(createMessage('C')),
                sequentialTransactionPlanResult([
                    // Tx #4: plain error with signature — should show (signature)
                    failedSingleTransactionPlanResult(createMessage('D'), new Error('D failed'), { signature: sigD }),
                    successfulSingleTransactionPlanResult(createMessage('E'), {
                        signature: '22222222222222222222222222222222222222222222' as Signature,
                    }),
                    // Tx #6: preflight error without signature — should show (preflight)
                    failedSingleTransactionPlanResult(
                        createMessage('F'),
                        createPreflightError(new Error('F failed'), preflightContext),
                    ),
                    // Tx #7: plain error without signature — no indicator
                    failedSingleTransactionPlanResult(createMessage('G'), new Error('G failed')),
                ]),
                canceledSingleTransactionPlanResult(createMessage('H')),
            ]);
            const error = createFailedToSendTransactionsError(result);
            expect(error.message).toBe(
                'Failed to send transactions.\n' +
                    '[Tx #2 (preflight)] B failed\n' +
                    `[Tx #4 (${sigD})] D failed\n` +
                    '[Tx #6 (preflight)] F failed\n' +
                    '[Tx #7] G failed\n',
            );
        });
    });

    it('sets transactionPlanResult as a non-enumerable property', () => {
        const messageA = createMessage('A');
        const errorA = new Error('A failed');
        const result = sequentialTransactionPlanResult([failedSingleTransactionPlanResult(messageA, errorA)]);
        const error = createFailedToSendTransactionsError(result);
        expect(error.context.transactionPlanResult).toBe(result);
        expect(Object.keys(error.context)).not.toContain('transactionPlanResult');
    });

    it('has the correct error code', () => {
        const messageA = createMessage('A');
        const errorA = new Error('A failed');
        const result = sequentialTransactionPlanResult([failedSingleTransactionPlanResult(messageA, errorA)]);
        const error = createFailedToSendTransactionsError(result);
        expect(error.context.__code).toBe(SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS);
    });
});

describe('createFailedToExecuteTransactionPlanError', () => {
    it('has the correct error code', () => {
        const result = sequentialTransactionPlanResult([
            failedSingleTransactionPlanResult(createMessage('A'), new Error('A failed')),
        ]);
        const error = createFailedToExecuteTransactionPlanError(result);
        expect(error.context.__code).toBe(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN);
    });

    it('sets transactionPlanResult as a non-enumerable property', () => {
        const result = sequentialTransactionPlanResult([
            failedSingleTransactionPlanResult(createMessage('A'), new Error('A failed')),
        ]);
        const error = createFailedToExecuteTransactionPlanError(result);
        expect(error.context.transactionPlanResult).toBe(result);
        expect(Object.keys(error.context)).not.toContain('transactionPlanResult');
    });

    it('sets abortReason in the context when provided', () => {
        const abortReason = new Error('User canceled');
        const result = sequentialTransactionPlanResult([canceledSingleTransactionPlanResult(createMessage('A'))]);
        const error = createFailedToExecuteTransactionPlanError(result, abortReason);
        expect(error.context.abortReason).toBe(abortReason);
    });

    it('sets abortReason to undefined when not provided', () => {
        const result = sequentialTransactionPlanResult([
            failedSingleTransactionPlanResult(createMessage('A'), new Error('A failed')),
        ]);
        const error = createFailedToExecuteTransactionPlanError(result);
        expect(error.context.abortReason).toBeUndefined();
    });
});
