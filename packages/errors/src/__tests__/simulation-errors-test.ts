import {
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
    SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS,
} from '../codes';
import { SolanaError } from '../error';
import { isSimulationError, RpcSimulateTransactionResult, unwrapSimulationError } from '../index';

const rpcSimulationError: Omit<RpcSimulateTransactionResult, 'err'> = {
    accounts: null,
    fee: null,
    loadedAccountsDataSize: null,
    loadedAddresses: { readonly: [], writable: [] },
    logs: null,
    postBalances: null,
    postTokenBalances: null,
    preBalances: null,
    preTokenBalances: null,
    replacementBlockhash: null,
    returnData: null,
    unitsConsumed: null,
};

const simulationErrorCodes = [
    ['a preflight failure', SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE],
    [
        'a simulation compute limit estimation failure',
        SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
    ],
    [
        'a simulation resource limits estimation failure',
        SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS,
    ],
] as const;

describe('isSimulationError', () => {
    describe.each(simulationErrorCodes)('given %s error', (_, code) => {
        it('returns true', () => {
            const error = new SolanaError(code, { ...rpcSimulationError, cause: new Error('underlying error') });
            expect(isSimulationError(error)).toBe(true);
        });

        it('returns true without a cause', () => {
            const error = new SolanaError(code, rpcSimulationError);
            expect(isSimulationError(error)).toBe(true);
        });
    });

    describe('given a non-simulation SolanaError', () => {
        it('returns false', () => {
            expect(isSimulationError(new SolanaError(SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE))).toBe(false);
        });
    });

    describe('given a regular Error', () => {
        it('returns false', () => {
            expect(isSimulationError(new Error('regular error'))).toBe(false);
        });
    });

    describe('given a non-error value', () => {
        it.each([
            ['a string', 'error string'],
            ['null', null],
            ['undefined', undefined],
            ['an object', {}],
        ])('returns false when given %s', (_, value) => {
            expect(isSimulationError(value)).toBe(false);
        });
    });
});

describe('unwrapSimulationError', () => {
    describe.each(simulationErrorCodes)('given %s error', (_, code) => {
        it('returns the cause of the error', () => {
            const cause = new Error('underlying error');
            const error = new SolanaError(code, { ...rpcSimulationError, cause });
            expect(unwrapSimulationError(error)).toBe(cause);
        });

        it('returns the original error unchanged when it has no cause', () => {
            const error = new SolanaError(code, rpcSimulationError);
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
