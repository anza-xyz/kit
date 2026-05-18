import { Address } from '@solana/addresses';
import {
    getSolanaErrorFromTransactionError,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_LOADED_ACCOUNTS_DATA_SIZE_LIMIT,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS,
    SolanaError,
} from '@solana/errors';
import { pipe } from '@solana/functional';
import { AccountRole } from '@solana/instructions';
import type { Rpc, SimulateTransactionApi } from '@solana/rpc';
import type { Blockhash, TransactionError } from '@solana/rpc-types';
import {
    getTransactionMessageComputeUnitLimit,
    getTransactionMessageLoadedAccountsDataSizeLimit,
    type Nonce,
    setTransactionMessageComputeUnitLimit,
    setTransactionMessageLoadedAccountsDataSizeLimit,
    type TransactionMessage,
    type TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import {
    Base64EncodedWireTransaction,
    compileTransaction,
    getBase64EncodedWireTransaction,
    Transaction,
} from '@solana/transactions';

import {
    estimateAndSetResourceLimitsFactory,
    estimateResourceLimitsFactory,
    fillTransactionMessageProvisoryResourceLimits,
} from '../resource-limit-estimation';

jest.mock('@solana/transactions', () => ({
    ...jest.requireActual('@solana/transactions'),
    compileTransaction: jest.fn(),
    getBase64EncodedWireTransaction: jest.fn(),
}));

const FOREVER_PROMISE = new Promise(() => {
    /* never resolve */
});

const MOCK_BLOCKHASH_LIFETIME_CONSTRAINT = {
    blockhash: 'GNtuHnNyW68wviopST3ki37Afv7LPphxfSwiHAkX5Q9H' as Blockhash,
    lastValidBlockHeight: 0n,
} as const;

const MOCK_V0_MESSAGE: TransactionMessage & TransactionMessageWithFeePayer = {
    feePayer: { address: '7U8VWgTUucttJPt5Bbkt48WknWqRGBfstBt8qqLHnfPT' as Address },
    instructions: [],
    version: 0,
};

const MOCK_V1_MESSAGE: TransactionMessage & TransactionMessageWithFeePayer & { version: 1 } = {
    feePayer: { address: '7U8VWgTUucttJPt5Bbkt48WknWqRGBfstBt8qqLHnfPT' as Address },
    instructions: [],
    version: 1,
};

describe('estimateResourceLimitsFactory', () => {
    let sendSimulateTransactionRequest: jest.Mock;
    let rpc: Rpc<SimulateTransactionApi>;
    let simulateTransaction: jest.Mock;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(compileTransaction).mockReturnValue({} as Transaction);
        jest.mocked(getBase64EncodedWireTransaction).mockReturnValue('MOCK_WIRE_BYTES' as Base64EncodedWireTransaction);
        sendSimulateTransactionRequest = jest.fn().mockReturnValue(FOREVER_PROMISE);
        simulateTransaction = jest.fn().mockReturnValue({ send: sendSimulateTransactionRequest });
        rpc = { simulateTransaction } as unknown as Rpc<SimulateTransactionApi>;
    });

    it('aborts the simulateTransaction request when aborted', () => {
        const abortController = new AbortController();
        const message = { ...MOCK_V0_MESSAGE, lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT };
        void estimateResourceLimitsFactory({ rpc })(message, { abortSignal: abortController.signal });
        expect(sendSimulateTransactionRequest).toHaveBeenCalledWith({
            abortSignal: expect.objectContaining({ aborted: false }),
        });
        abortController.abort();
        expect(sendSimulateTransactionRequest).toHaveBeenCalledWith({
            abortSignal: expect.objectContaining({ aborted: true }),
        });
    });

    it('passes the expected config to the simulation request', () => {
        const message = { ...MOCK_V0_MESSAGE, lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT };
        void estimateResourceLimitsFactory({ rpc })(message, {
            commitment: 'finalized',
            minContextSlot: 42n,
        });
        expect(simulateTransaction).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                commitment: 'finalized',
                encoding: 'base64',
                minContextSlot: 42n,
                sigVerify: false,
            }),
        );
    });

    it('compiles the v0 message with the max compute unit limit instruction', () => {
        const message = { ...MOCK_V0_MESSAGE, lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT };
        void estimateResourceLimitsFactory({ rpc })(message);
        expect(compileTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                instructions: expect.arrayContaining([
                    expect.objectContaining({
                        data: new Uint8Array([0x02, 0xc0, 0x5c, 0x15, 0x00]),
                        programAddress: 'ComputeBudget111111111111111111111111111111',
                    }),
                ]),
            }),
        );
    });

    it('does not set a loaded accounts data size limit on v0 messages before simulating', () => {
        const message = { ...MOCK_V0_MESSAGE, lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT };
        void estimateResourceLimitsFactory({ rpc })(message);
        // SetLoadedAccountsDataSizeLimit (0x04) instruction should not be added on v0 messages.
        expect(compileTransaction).not.toHaveBeenCalledWith(
            expect.objectContaining({
                instructions: expect.arrayContaining([
                    expect.objectContaining({
                        data: expect.objectContaining({ 0: 0x04 }),
                        programAddress: 'ComputeBudget111111111111111111111111111111',
                    }),
                ]),
            }),
        );
    });

    it('sets the max loaded accounts data size limit on v1 messages before simulating', () => {
        const message = { ...MOCK_V1_MESSAGE, lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT };
        void estimateResourceLimitsFactory({ rpc })(message);
        expect(compileTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                config: expect.objectContaining({
                    computeUnitLimit: 1_400_000,
                    loadedAccountsDataSizeLimit: 64 * 1024 * 1024,
                }),
            }),
        );
    });

    it('does not ask for a replacement blockhash for durable nonce transactions', () => {
        const message = {
            ...MOCK_V0_MESSAGE,
            instructions: [
                {
                    accounts: [
                        {
                            address: '7wJFRFuAE9x5Ptnz2VoBWsfecTCfuuM2sQCpECGypnTU' as Address,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: 'SysvarRecentB1ockHashes11111111111111111111' as Address,
                            role: AccountRole.READONLY,
                        },
                        {
                            address: 'HzMoc78z1VNNf9nwD4Czt6CDYEb9LVD8KsVGP46FEmyJ' as Address,
                            role: AccountRole.READONLY_SIGNER,
                        },
                    ],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddress: '11111111111111111111111111111111' as Address,
                },
            ],
            lifetimeConstraint: {
                nonce: 'BzAqD6382v5r1pcELoi8HWrBDV4dSL9NGemMn2JYAhxc' as Nonce,
            },
        };
        void estimateResourceLimitsFactory({ rpc })(message);
        expect(simulateTransaction).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ replaceRecentBlockhash: false }),
        );
    });

    it('asks for a replacement blockhash for blockhash-lifetime transactions', () => {
        const message = { ...MOCK_V0_MESSAGE, lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT };
        void estimateResourceLimitsFactory({ rpc })(message);
        expect(simulateTransaction).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ replaceRecentBlockhash: true }),
        );
    });

    it('returns only computeUnitLimit for v0 messages when the RPC omits loadedAccountsDataSize', async () => {
        expect.assertions(1);
        sendSimulateTransactionRequest.mockResolvedValue({ value: { unitsConsumed: 42n } });
        await expect(estimateResourceLimitsFactory({ rpc })(MOCK_V0_MESSAGE)).resolves.toEqual({
            computeUnitLimit: 42,
        });
    });

    it('passes through loadedAccountsDataSize on v0 messages when the RPC returns it', async () => {
        expect.assertions(1);
        sendSimulateTransactionRequest.mockResolvedValue({
            value: { loadedAccountsDataSize: 1234, unitsConsumed: 42n },
        });
        await expect(estimateResourceLimitsFactory({ rpc })(MOCK_V0_MESSAGE)).resolves.toEqual({
            computeUnitLimit: 42,
            loadedAccountsDataSizeLimit: 1234,
        });
    });

    it('returns both limits for v1 messages on success', async () => {
        expect.assertions(1);
        sendSimulateTransactionRequest.mockResolvedValue({
            value: { loadedAccountsDataSize: 1234, unitsConsumed: 42n },
        });
        await expect(estimateResourceLimitsFactory({ rpc })(MOCK_V1_MESSAGE)).resolves.toEqual({
            computeUnitLimit: 42,
            loadedAccountsDataSizeLimit: 1234,
        });
    });

    it('throws when the RPC omits loadedAccountsDataSize for a v1 message', async () => {
        expect.assertions(1);
        sendSimulateTransactionRequest.mockResolvedValue({ value: { unitsConsumed: 42n } });
        await expect(estimateResourceLimitsFactory({ rpc })(MOCK_V1_MESSAGE)).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_LOADED_ACCOUNTS_DATA_SIZE_LIMIT),
        );
    });

    it('caps the estimated compute units to u32 max', async () => {
        expect.assertions(1);
        sendSimulateTransactionRequest.mockResolvedValue({ value: { unitsConsumed: 5_000_000_000n } });
        await expect(estimateResourceLimitsFactory({ rpc })(MOCK_V0_MESSAGE)).resolves.toEqual({
            computeUnitLimit: 4_294_967_295,
        });
    });

    it('throws with the transaction error as cause when the transaction fails in simulation', async () => {
        expect.assertions(1);
        const transactionError: TransactionError = 'AccountNotFound';
        const simulationResult = {
            accounts: null,
            fee: null,
            loadedAccountsDataSize: 1234,
            loadedAddresses: null,
            logs: null,
            postBalances: null,
            postTokenBalances: null,
            preBalances: null,
            preTokenBalances: null,
            replacementBlockhash: null,
            returnData: null,
            unitsConsumed: 42n,
        };
        sendSimulateTransactionRequest.mockResolvedValue({
            value: { err: transactionError, ...simulationResult },
        });
        await expect(estimateResourceLimitsFactory({ rpc })(MOCK_V1_MESSAGE)).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS, {
                ...simulationResult,
                cause: getSolanaErrorFromTransactionError(transactionError),
            }),
        );
    });

    it('throws with the cause when simulation fails', async () => {
        expect.assertions(1);
        const cause = new Error('RPC connection failed');
        sendSimulateTransactionRequest.mockRejectedValue(cause);
        await expect(estimateResourceLimitsFactory({ rpc })(MOCK_V0_MESSAGE)).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT, { cause }),
        );
    });
});

describe('estimateAndSetResourceLimitsFactory', () => {
    it('sets the compute unit limit on a v0 message when none exists', async () => {
        expect.assertions(2);
        const mockEstimator = jest.fn().mockResolvedValue({ computeUnitLimit: 42 });
        const estimateAndSet = estimateAndSetResourceLimitsFactory(mockEstimator);
        const result = await estimateAndSet(MOCK_V0_MESSAGE);
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(42);
        expect(getTransactionMessageLoadedAccountsDataSizeLimit(result)).toBeUndefined();
    });

    it('sets both limits on a v1 message when none exist', async () => {
        expect.assertions(2);
        const mockEstimator = jest.fn().mockResolvedValue({ computeUnitLimit: 42, loadedAccountsDataSizeLimit: 1234 });
        const estimateAndSet = estimateAndSetResourceLimitsFactory(mockEstimator);
        const result = await estimateAndSet(MOCK_V1_MESSAGE);
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(42);
        expect(getTransactionMessageLoadedAccountsDataSizeLimit(result)).toBe(1234);
    });

    it('updates the v1 loaded accounts data size limit when set to the provisory value', async () => {
        expect.assertions(1);
        const mockEstimator = jest.fn().mockResolvedValue({ computeUnitLimit: 42, loadedAccountsDataSizeLimit: 1234 });
        const estimateAndSet = estimateAndSetResourceLimitsFactory(mockEstimator);
        const message = setTransactionMessageLoadedAccountsDataSizeLimit(0, MOCK_V1_MESSAGE);
        const result = await estimateAndSet(message);
        expect(getTransactionMessageLoadedAccountsDataSizeLimit(result)).toBe(1234);
    });

    it('preserves an explicitly set v1 loaded accounts data size limit', async () => {
        expect.assertions(2);
        const mockEstimator = jest.fn();
        const estimateAndSet = estimateAndSetResourceLimitsFactory(mockEstimator);
        const message = pipe(
            MOCK_V1_MESSAGE,
            m => setTransactionMessageComputeUnitLimit(123_456, m),
            m => setTransactionMessageLoadedAccountsDataSizeLimit(999, m),
        );
        const result = await estimateAndSet(message);
        expect(mockEstimator).not.toHaveBeenCalled();
        expect(getTransactionMessageLoadedAccountsDataSizeLimit(result)).toBe(999);
    });

    it('preserves an explicit v1 loaded accounts data size limit when set to the runtime max (64 MiB)', async () => {
        expect.assertions(2);
        const mockEstimator = jest.fn().mockResolvedValue({ computeUnitLimit: 42, loadedAccountsDataSizeLimit: 1234 });
        const estimateAndSet = estimateAndSetResourceLimitsFactory(mockEstimator);
        const message = setTransactionMessageLoadedAccountsDataSizeLimit(64 * 1024 * 1024, MOCK_V1_MESSAGE);
        const result = await estimateAndSet(message);
        // The CU limit still needs estimating since it was unset, so the estimator is called.
        expect(mockEstimator).toHaveBeenCalledTimes(1);
        // The explicit max data size limit is left alone.
        expect(getTransactionMessageLoadedAccountsDataSizeLimit(result)).toBe(64 * 1024 * 1024);
    });

    it('updates compute unit limit but leaves explicit loaded accounts data size limit untouched on v1', async () => {
        expect.assertions(2);
        const mockEstimator = jest.fn().mockResolvedValue({ computeUnitLimit: 42, loadedAccountsDataSizeLimit: 1234 });
        const estimateAndSet = estimateAndSetResourceLimitsFactory(mockEstimator);
        const message = setTransactionMessageLoadedAccountsDataSizeLimit(999, MOCK_V1_MESSAGE);
        const result = await estimateAndSet(message);
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(42);
        expect(getTransactionMessageLoadedAccountsDataSizeLimit(result)).toBe(999);
    });

    it('forwards the abort signal to the estimator', async () => {
        expect.assertions(1);
        const mockEstimator = jest.fn().mockResolvedValue({ computeUnitLimit: 42 });
        const estimateAndSet = estimateAndSetResourceLimitsFactory(mockEstimator);
        const abortController = new AbortController();
        await estimateAndSet(MOCK_V0_MESSAGE, { abortSignal: abortController.signal });
        expect(mockEstimator).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ abortSignal: abortController.signal }),
        );
    });
});

describe('fillTransactionMessageProvisoryResourceLimits', () => {
    it('sets the compute unit limit to 0 on a v0 message when none exists', () => {
        const result = fillTransactionMessageProvisoryResourceLimits(MOCK_V0_MESSAGE);
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(0);
    });

    it('does not set a loaded accounts data size limit on a v0 message', () => {
        const result = fillTransactionMessageProvisoryResourceLimits(MOCK_V0_MESSAGE);
        expect(getTransactionMessageLoadedAccountsDataSizeLimit(result)).toBeUndefined();
    });

    it('sets both limits to 0 on a v1 message when none exist', () => {
        const result = fillTransactionMessageProvisoryResourceLimits(MOCK_V1_MESSAGE);
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(0);
        expect(getTransactionMessageLoadedAccountsDataSizeLimit(result)).toBe(0);
    });

    it('preserves an existing compute unit limit', () => {
        const message = setTransactionMessageComputeUnitLimit(200_000, MOCK_V0_MESSAGE);
        const result = fillTransactionMessageProvisoryResourceLimits(message);
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(200_000);
    });

    it('preserves an existing loaded accounts data size limit on v1', () => {
        const message = setTransactionMessageLoadedAccountsDataSizeLimit(64_000, MOCK_V1_MESSAGE);
        const result = fillTransactionMessageProvisoryResourceLimits(message);
        expect(getTransactionMessageLoadedAccountsDataSizeLimit(result)).toBe(64_000);
    });

    it('returns the same v0 reference when a compute unit limit already exists', () => {
        const message = setTransactionMessageComputeUnitLimit(200_000, MOCK_V0_MESSAGE);
        const result = fillTransactionMessageProvisoryResourceLimits(message);
        expect(result).toBe(message);
    });

    it('returns the same v0 reference when a provisory compute unit limit is already set', () => {
        const message = setTransactionMessageComputeUnitLimit(0, MOCK_V0_MESSAGE);
        const result = fillTransactionMessageProvisoryResourceLimits(message);
        expect(result).toBe(message);
    });

    it('returns the same v1 reference when both limits are already set', () => {
        const message = pipe(
            MOCK_V1_MESSAGE,
            m => setTransactionMessageComputeUnitLimit(200_000, m),
            m => setTransactionMessageLoadedAccountsDataSizeLimit(64_000, m),
        );
        const result = fillTransactionMessageProvisoryResourceLimits(message);
        expect(result).toBe(message);
    });

    it('returns the same v1 reference when both limits are set to provisory values', () => {
        const message = pipe(
            MOCK_V1_MESSAGE,
            m => setTransactionMessageComputeUnitLimit(0, m),
            m => setTransactionMessageLoadedAccountsDataSizeLimit(0, m),
        );
        const result = fillTransactionMessageProvisoryResourceLimits(message);
        expect(result).toBe(message);
    });
});
