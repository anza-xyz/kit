import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
} from '@solana/errors';
import { AccountRole } from '@solana/instructions';
import type { Rpc, SimulateTransactionApi } from '@solana/rpc';
import type { Blockhash, TransactionError } from '@solana/rpc-types';
import {
    getTransactionMessageComputeUnitLimit,
    type Nonce,
    setTransactionMessageComputeUnitLimit,
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
    estimateAndSetComputeUnitLimitFactory,
    estimateComputeUnitLimitFactory,
    fillTransactionMessageProvisoryComputeUnitLimit,
} from '../compute-unit-limit-estimation';

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

const MOCK_TRANSACTION_MESSAGE: TransactionMessage & TransactionMessageWithFeePayer = {
    feePayer: { address: '7U8VWgTUucttJPt5Bbkt48WknWqRGBfstBt8qqLHnfPT' as Address },
    instructions: [],
    version: 0,
};

describe('estimateComputeUnitLimitFactory', () => {
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
        const message = { ...MOCK_TRANSACTION_MESSAGE, lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT };
        estimateComputeUnitLimitFactory({ rpc })(message, { abortSignal: abortController.signal }).catch(() => {});
        expect(sendSimulateTransactionRequest).toHaveBeenCalledWith({
            abortSignal: expect.objectContaining({ aborted: false }),
        });
        abortController.abort();
        expect(sendSimulateTransactionRequest).toHaveBeenCalledWith({
            abortSignal: expect.objectContaining({ aborted: true }),
        });
    });

    it('passes the expected config to the simulation request', () => {
        const message = { ...MOCK_TRANSACTION_MESSAGE, lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT };
        estimateComputeUnitLimitFactory({ rpc })(message, {
            commitment: 'finalized',
            minContextSlot: 42n,
        }).catch(() => {});
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

    it('appends a set compute unit limit instruction when one does not exist', () => {
        const message = { ...MOCK_TRANSACTION_MESSAGE, lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT };
        estimateComputeUnitLimitFactory({ rpc })(message).catch(() => {});
        expect(compileTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                instructions: [
                    {
                        data:
                            // prettier-ignore
                            new Uint8Array([
                                0x02, // SetComputeUnitLimit instruction index
                                0xc0, 0x5c, 0x15, 0x00, // 1,400,000 (MAX_COMPUTE_UNIT_LIMIT)
                            ]),
                        programAddress: 'ComputeBudget111111111111111111111111111111',
                    },
                ],
            }),
        );
    });

    it('replaces an existing compute unit limit instruction with max before simulating', () => {
        const message = {
            ...MOCK_TRANSACTION_MESSAGE,
            instructions: [
                { programAddress: '4Kk4nA3F2nWHCcuyT8nR6oF7HQUQHmmzAVD5k8FQPKB2' as Address },
                {
                    data:
                        // prettier-ignore
                        new Uint8Array([
                            0x02, // SetComputeUnitLimit instruction index
                            0x01, 0x02, 0x03, 0x04, // ComputeUnits(u32)
                        ]),
                    programAddress: 'ComputeBudget111111111111111111111111111111' as Address,
                },
                { programAddress: '4Kk4nA3F2nWHCcuyT8nR6oF7HQUQHmmzAVD5k8FQPKB2' as Address },
            ],
            lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT,
        };
        estimateComputeUnitLimitFactory({ rpc })(message).catch(() => {});
        expect(compileTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                instructions: [
                    message.instructions[0],
                    {
                        ...message.instructions[1],
                        data: new Uint8Array([0x02, 0xc0, 0x5c, 0x15, 0x00]), // Replaced with MAX_COMPUTE_UNIT_LIMIT
                    },
                    message.instructions[2],
                ],
            }),
        );
    });

    it('does not ask for a replacement blockhash when the transaction message is a durable nonce transaction', () => {
        const message = {
            ...MOCK_TRANSACTION_MESSAGE,
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
        estimateComputeUnitLimitFactory({ rpc })(message).catch(() => {});
        expect(simulateTransaction).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ replaceRecentBlockhash: false }),
        );
    });

    it('asks for a replacement blockhash when the transaction message has a blockhash lifetime', () => {
        const message = { ...MOCK_TRANSACTION_MESSAGE, lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT };
        estimateComputeUnitLimitFactory({ rpc })(message).catch(() => {});
        expect(simulateTransaction).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ replaceRecentBlockhash: true }),
        );
    });

    it('asks for a replacement blockhash when the transaction message has no lifetime', () => {
        estimateComputeUnitLimitFactory({ rpc })(MOCK_TRANSACTION_MESSAGE).catch(() => {});
        expect(simulateTransaction).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ replaceRecentBlockhash: true }),
        );
    });

    it('returns the estimated compute units on success', async () => {
        expect.assertions(1);
        sendSimulateTransactionRequest.mockResolvedValue({ value: { unitsConsumed: 42n } });
        const estimatePromise = estimateComputeUnitLimitFactory({ rpc })(MOCK_TRANSACTION_MESSAGE);
        await expect(estimatePromise).resolves.toBe(42);
    });

    it('caps the estimated compute units to u32 max', async () => {
        expect.assertions(1);
        sendSimulateTransactionRequest.mockResolvedValue({ value: { unitsConsumed: 5_000_000_000n } });
        const estimatePromise = estimateComputeUnitLimitFactory({ rpc })(MOCK_TRANSACTION_MESSAGE);
        await expect(estimatePromise).resolves.toBe(4_294_967_295);
    });

    it('throws with the transaction error as cause when the transaction fails in simulation', async () => {
        expect.assertions(1);
        const transactionError: TransactionError = 'AccountNotFound';
        sendSimulateTransactionRequest.mockResolvedValue({
            value: { err: transactionError, unitsConsumed: 42n },
        });
        const estimatePromise = estimateComputeUnitLimitFactory({ rpc })(MOCK_TRANSACTION_MESSAGE);
        await expect(estimatePromise).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({
                    __code: SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
                    unitsConsumed: 42n,
                }),
            }),
        );
    });

    it('throws with the cause when simulation fails', async () => {
        expect.assertions(1);
        const simulationError = new Error('RPC connection failed');
        sendSimulateTransactionRequest.mockRejectedValue(simulationError);
        const estimatePromise = estimateComputeUnitLimitFactory({ rpc })(MOCK_TRANSACTION_MESSAGE);
        await expect(estimatePromise).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({
                    __code: SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT,
                }),
            }),
        );
    });
});

describe('estimateAndSetComputeUnitLimitFactory', () => {
    it('sets the compute unit limit when none exists', async () => {
        expect.assertions(1);
        const mockEstimator = jest.fn().mockResolvedValue(42);
        const estimateAndSet = estimateAndSetComputeUnitLimitFactory(mockEstimator);
        const result = await estimateAndSet(MOCK_TRANSACTION_MESSAGE);
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(42);
    });

    it('updates when compute unit limit is set to provisory value (0)', async () => {
        expect.assertions(1);
        const mockEstimator = jest.fn().mockResolvedValue(42);
        const estimateAndSet = estimateAndSetComputeUnitLimitFactory(mockEstimator);
        const message = setTransactionMessageComputeUnitLimit(0, MOCK_TRANSACTION_MESSAGE);
        const result = await estimateAndSet(message);
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(42);
    });

    it('updates when compute unit limit is set to max (1_400_000)', async () => {
        expect.assertions(1);
        const mockEstimator = jest.fn().mockResolvedValue(42);
        const estimateAndSet = estimateAndSetComputeUnitLimitFactory(mockEstimator);
        const message = setTransactionMessageComputeUnitLimit(1_400_000, MOCK_TRANSACTION_MESSAGE);
        const result = await estimateAndSet(message);
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(42);
    });

    it('does not update when compute unit limit is set to an explicit value', async () => {
        expect.assertions(2);
        const mockEstimator = jest.fn().mockResolvedValue(42);
        const estimateAndSet = estimateAndSetComputeUnitLimitFactory(mockEstimator);
        const message = setTransactionMessageComputeUnitLimit(123_456, MOCK_TRANSACTION_MESSAGE);
        const result = await estimateAndSet(message);
        expect(mockEstimator).not.toHaveBeenCalled();
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(123_456);
    });

    it('forwards the abort signal to the estimator', async () => {
        expect.assertions(1);
        const mockEstimator = jest.fn().mockResolvedValue(42);
        const estimateAndSet = estimateAndSetComputeUnitLimitFactory(mockEstimator);
        const abortController = new AbortController();
        await estimateAndSet(MOCK_TRANSACTION_MESSAGE, { abortSignal: abortController.signal });
        expect(mockEstimator).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ abortSignal: abortController.signal }),
        );
    });
});

describe('fillTransactionMessageProvisoryComputeUnitLimit', () => {
    it('sets compute unit limit to 0 when none exists', () => {
        const result = fillTransactionMessageProvisoryComputeUnitLimit(MOCK_TRANSACTION_MESSAGE);
        expect(getTransactionMessageComputeUnitLimit(result)).toBe(0);
    });

    it('returns the same reference when a compute unit limit already exists', () => {
        const message = setTransactionMessageComputeUnitLimit(200_000, MOCK_TRANSACTION_MESSAGE);
        const result = fillTransactionMessageProvisoryComputeUnitLimit(message);
        expect(result).toBe(message);
    });

    it('returns the same reference when provisory limit is already set', () => {
        const message = setTransactionMessageComputeUnitLimit(0, MOCK_TRANSACTION_MESSAGE);
        const result = fillTransactionMessageProvisoryComputeUnitLimit(message);
        expect(result).toBe(message);
    });
});
