import {
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
    SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
} from '../codes';
import { SolanaError } from '../error';
import { RpcSimulateTransactionResult } from '../json-rpc-error';
import { unwrapSimulationError } from '../simulation-errors';

const rpcSimulationError: Omit<RpcSimulateTransactionResult, 'err'> = {
    accounts: null,
    loadedAccountsDataSize: null,
    logs: null,
    replacementBlockhash: null,
    returnData: null,
    unitsConsumed: null,
};

describe('unwrapSimulationError', () => {
    describe('given a preflight failure error', () => {
        it('returns the cause of the error', () => {
            const cause = new Error('underlying error');
            const error = new SolanaError(SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE, {
                ...rpcSimulationError,
                cause,
            });
            expect(unwrapSimulationError(error)).toBe(cause);
        });
    });

    describe('given a preflight failure error without a cause', () => {
        it('returns the original error unchanged', () => {
            const error = new SolanaError(SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE, {
                ...rpcSimulationError,
            });
            expect(unwrapSimulationError(error)).toBe(error);
        });
    });

    describe('given a simulation compute limit estimation failure error', () => {
        it('returns the cause of the error', () => {
            const cause = new Error('underlying error');
            const error = new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT, {
                cause,
                unitsConsumed: 5000,
            });
            expect(unwrapSimulationError(error)).toBe(cause);
        });
    });

    describe('given a simulation compute limit estimation failure error without a cause', () => {
        it('returns the original error unchanged', () => {
            const error = new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT, {
                unitsConsumed: 5000,
            });
            expect(unwrapSimulationError(error)).toBe(error);
        });
    });

    describe('given a non-simulation SolanaError', () => {
        it('returns the original error unchanged', () => {
            const error = new SolanaError(SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE);
            expect(unwrapSimulationError(error)).toBe(error);
        });
    });

    describe('given a regular Error', () => {
        it('returns the original error unchanged', () => {
            const error = new Error('regular error');
            expect(unwrapSimulationError(error)).toBe(error);
        });
    });

    describe('given a non-error value', () => {
        it('returns the original value unchanged when given a string', () => {
            const value = 'error string';
            expect(unwrapSimulationError(value)).toBe(value);
        });

        it('returns the original value unchanged when given null', () => {
            expect(unwrapSimulationError(null)).toBeNull();
        });

        it('returns the original value unchanged when given undefined', () => {
            expect(unwrapSimulationError(undefined)).toBeUndefined();
        });

        it('returns the original value unchanged when given an object', () => {
            const value = { message: 'error' };
            expect(unwrapSimulationError(value)).toBe(value);
        });
    });
});
