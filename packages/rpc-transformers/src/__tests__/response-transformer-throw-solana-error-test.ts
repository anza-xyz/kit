import { getSolanaErrorFromJsonRpcError } from '@solana/errors';
import { RpcRequest } from '@solana/rpc-spec-types';

import { getThrowSolanaErrorResponseTransformer } from '../response-transformer-throw-solana-error';

jest.mock('@solana/errors', () => ({
    ...jest.requireActual('@solana/errors'),
    getSolanaErrorFromJsonRpcError: jest.fn(),
}));

describe('getThrowSolanaErrorResponseTransformer', () => {
    let mockGetSolanaErrorFromJsonRpcError: jest.Mock;
    const request = { methodName: 'getBalance' } as RpcRequest;

    beforeEach(() => {
        mockGetSolanaErrorFromJsonRpcError = getSolanaErrorFromJsonRpcError as jest.Mock;
        mockGetSolanaErrorFromJsonRpcError.mockClear();
    });

    describe('when the response contains a result', () => {
        it('returns the response as-is', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const response = { result: { value: 123n } };

            const result = transformer(response, request);

            expect(result).toStrictEqual(response);
            expect(mockGetSolanaErrorFromJsonRpcError).not.toHaveBeenCalled();
        });

        it('returns complex result objects unchanged', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const response = {
                result: {
                    context: { slot: 123n },
                    value: [{ account: 'test', lamports: 456n }],
                },
            };

            const result = transformer(response, request);

            expect(result).toStrictEqual(response);
            expect(mockGetSolanaErrorFromJsonRpcError).not.toHaveBeenCalled();
        });
    });

    describe('when the response contains an error', () => {
        it('throws a SolanaError for a standard RPC error', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const mockError = new Error('Mock Solana Error');
            const errorResponse = {
                error: { code: -32600, message: 'Invalid Request' },
            };

            mockGetSolanaErrorFromJsonRpcError.mockImplementation(() => {
                throw mockError;
            });

            expect(() => transformer(errorResponse, request)).toThrow(mockError);
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledWith(errorResponse.error);
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledTimes(1);
        });
    });

    describe('when the response contains a sendTransaction preflight failure (-32002)', () => {
        it('transforms BigInt values in error.data before throwing for numeric error code', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const mockError = new Error('Preflight failure');
            const errorResponse = {
                error: {
                    code: -32002,
                    data: {
                        accounts: null,
                        err: 'InsufficientFundsForRent',
                        innerInstructions: null,
                        loadedAccountsDataSize: 100n, // Should be downcast to number
                        logs: ['log1', 'log2'],
                        replacementBlockhash: null,
                        returnData: null,
                        unitsConsumed: 5000n, // Should remain as BigInt
                    },
                    message: 'Transaction simulation failed',
                },
            };

            mockGetSolanaErrorFromJsonRpcError.mockImplementation(() => {
                throw mockError;
            });

            expect(() => transformer(errorResponse, request)).toThrow(mockError);
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledTimes(1);

            // Verify that the error was transformed before being passed
            const transformedError = mockGetSolanaErrorFromJsonRpcError.mock.calls[0][0];
            expect(transformedError).toHaveProperty('code', -32002);
            expect(transformedError).toHaveProperty('data');
            expect(transformedError.data).toHaveProperty('loadedAccountsDataSize', 100);
            expect(transformedError.data).toHaveProperty('unitsConsumed', 5000n);
        });

        it('transforms BigInt values in error.data before throwing for bigint error code', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const mockError = new Error('Preflight failure');
            const errorResponse = {
                error: {
                    code: -32002n, // BigInt code
                    data: {
                        accounts: null,
                        err: 'InsufficientFundsForRent',
                        innerInstructions: null,
                        loadedAccountsDataSize: 100n,
                        logs: ['log1', 'log2'],
                        replacementBlockhash: null,
                        returnData: null,
                        unitsConsumed: 5000n,
                    },
                    message: 'Transaction simulation failed',
                },
            };

            mockGetSolanaErrorFromJsonRpcError.mockImplementation(() => {
                throw mockError;
            });

            expect(() => transformer(errorResponse, request)).toThrow(mockError);
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledTimes(1);

            // Verify that the error was transformed before being passed
            const transformedError = mockGetSolanaErrorFromJsonRpcError.mock.calls[0][0];
            expect(transformedError).toHaveProperty('code', -32002n);
            expect(transformedError).toHaveProperty('data');
            expect(transformedError.data).toHaveProperty('loadedAccountsDataSize', 100);
            expect(transformedError.data).toHaveProperty('unitsConsumed', 5000n);
        });

        it('handles preflight failure with nested account data', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const mockError = new Error('Preflight failure');
            const errorResponse = {
                error: {
                    code: -32002,
                    data: {
                        accounts: [
                            {
                                data: ['base64data', 'base64'],
                                executable: false,
                                lamports: 1000000n, // Should remain as bigint
                                owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                rentEpoch: 361n,
                            },
                        ],
                    },
                    message: 'Transaction simulation failed',
                },
            };

            mockGetSolanaErrorFromJsonRpcError.mockImplementation(() => {
                throw mockError;
            });

            expect(() => transformer(errorResponse, request)).toThrow(mockError);
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledTimes(1);

            const transformedError = mockGetSolanaErrorFromJsonRpcError.mock.calls[0][0];
            expect(transformedError).toHaveProperty('code', -32002);
            expect(transformedError).toHaveProperty('data');
            expect(transformedError.data).toHaveProperty('accounts');
            const account = transformedError.data.accounts[0];
            expect(account).toHaveProperty('lamports', 1000000n);
            expect(account).toHaveProperty('rentEpoch', 361n);
        });

        it('handles preflight failure with nested inner instructions data', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const mockError = new Error('Preflight failure');
            const errorResponse = {
                error: {
                    code: -32002,
                    data: {
                        innerInstructions: [
                            {
                                index: 0n, // Should be downcast to number
                                instructions: [
                                    {
                                        accounts: [0n, 1n], // Should be downcast to number
                                        data: 'base64data',
                                        programIdIndex: 2n, // Should be downcast to number
                                        stackHeight: null,
                                    },
                                ],
                            },
                        ],
                    },
                    message: 'Transaction simulation failed',
                },
            };

            mockGetSolanaErrorFromJsonRpcError.mockImplementation(() => {
                throw mockError;
            });

            expect(() => transformer(errorResponse, request)).toThrow(mockError);
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledTimes(1);

            const transformedError = mockGetSolanaErrorFromJsonRpcError.mock.calls[0][0];
            expect(transformedError).toHaveProperty('code', -32002);
            expect(transformedError).toHaveProperty('data');
            expect(transformedError.data).toHaveProperty('innerInstructions');
            const innerInstruction = transformedError.data.innerInstructions[0];
            expect(innerInstruction).toHaveProperty('index', 0);
            const instruction = innerInstruction.instructions[0];
            expect(instruction).toHaveProperty('accounts', [0, 1]);
            expect(instruction).toHaveProperty('programIdIndex', 2);
        });

        it('handles preflight failure without data field', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const mockError = new Error('Preflight failure');
            const errorResponse = {
                error: {
                    code: -32002,
                    message: 'Transaction simulation failed',
                },
            };

            mockGetSolanaErrorFromJsonRpcError.mockImplementation(() => {
                throw mockError;
            });

            expect(() => transformer(errorResponse, request)).toThrow(mockError);
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledWith(errorResponse.error);
        });

        it('handles preflight failure with null data', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const mockError = new Error('Preflight failure');
            const errorResponse = {
                error: {
                    code: -32002,
                    data: null,
                    message: 'Transaction simulation failed',
                },
            };

            mockGetSolanaErrorFromJsonRpcError.mockImplementation(() => {
                throw mockError;
            });

            expect(() => transformer(errorResponse, request)).toThrow(mockError);
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledWith(errorResponse.error);
        });
    });

    describe('edge cases', () => {
        it('handles error without code property', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const mockError = new Error('Malformed error');
            const errorResponse = {
                error: { message: 'Something went wrong' },
            };

            mockGetSolanaErrorFromJsonRpcError.mockImplementation(() => {
                throw mockError;
            });

            expect(() => transformer(errorResponse, request)).toThrow(mockError);
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledWith(errorResponse.error);
        });

        it('handles null error', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const mockError = new Error('Null error');
            const errorResponse = {
                error: null,
            };

            mockGetSolanaErrorFromJsonRpcError.mockImplementation(() => {
                throw mockError;
            });

            expect(() => transformer(errorResponse, request)).toThrow(mockError);
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledWith(null);
        });

        it('handles error code that is not -32002', () => {
            const transformer = getThrowSolanaErrorResponseTransformer();
            const mockError = new Error('Other error');
            const errorResponse = {
                error: {
                    code: -32603,
                    data: {
                        someField: 100n,
                    },
                    message: 'Internal error',
                },
            };

            mockGetSolanaErrorFromJsonRpcError.mockImplementation(() => {
                throw mockError;
            });

            expect(() => transformer(errorResponse, request)).toThrow(mockError);
            // Should not transform data for non-preflight errors
            expect(mockGetSolanaErrorFromJsonRpcError).toHaveBeenCalledWith(errorResponse.error);
        });
    });
});
