import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import { createRpc, type Rpc } from '@solana/rpc-spec';

import {
    createSolanaRpcApi,
    GetAgGenesisCertApi,
    GetBlockApi,
    GetTransactionApi,
    GetTransactionsForAddressApi,
    SimulateTransactionApi,
} from '../index';

const MOCK_SIGNATURE =
    '4nHvMbxHURt2AXd7yQpKSKM5XCVKQiNbfsFmvPtHNJnJPSJHFT6cGUUNQGYK3wcxDCTvBMTLpQFf6HGqhLTUsxwj' as Signature;

const MOCK_TRANSACTION_CONFIG = {
    computeUnitLimit: 20_000,
    heapSize: 32_768,
    loadedAccountsDataSizeLimit: 65_536,
    priorityFee: 5_000,
};

const MOCK_TOKEN_BALANCE = {
    accountIndex: 1,
    mint: 'So11111111111111111111111111111111111111112',
    uiTokenAmount: {
        amount: '1000000000',
        decimals: 9,
        uiAmount: 1,
        uiAmountString: '1',
    },
};

function createMockRpc<TApi>(result: unknown): Rpc<TApi> {
    return createRpc({
        api: createSolanaRpcApi<never>(),
        transport: jest.fn().mockResolvedValue({ result }),
    });
}

describe('the default response transformer for the Solana RPC', () => {
    describe('getAgGenesisCert', () => {
        it('upcasts the slot to a `bigint` but leaves the byte arrays as numbers', async () => {
            expect.assertions(4);
            const rpc = createMockRpc<GetAgGenesisCertApi>({
                block: { blockId: [1, 2, 3], slot: 42 },
                signature: { bitmap: [7, 8, 9], signature: [4, 5, 6] },
            });
            const result = await rpc.getAgGenesisCert().send();
            expect(result?.block.slot).toBe(42n);
            expect(result?.block.blockId).toStrictEqual([1, 2, 3]);
            expect(result?.signature.signature).toStrictEqual([4, 5, 6]);
            expect(result?.signature.bitmap).toStrictEqual([7, 8, 9]);
        });
    });
    describe('getTransaction', () => {
        it('leaves `version` as a number', async () => {
            expect.assertions(1);
            const rpc = createMockRpc<GetTransactionApi>({ meta: null, slot: 1, version: 0 });
            const result = await rpc
                .getTransaction(MOCK_SIGNATURE, { encoding: 'json', maxSupportedTransactionVersion: 0 })
                .send();
            expect(result?.version).toBe(0);
        });
        it('leaves the string `version` of a legacy transaction alone', async () => {
            expect.assertions(1);
            const rpc = createMockRpc<GetTransactionApi>({ meta: null, slot: 1, version: 'legacy' });
            const result = await rpc
                .getTransaction(MOCK_SIGNATURE, { encoding: 'json', maxSupportedTransactionVersion: 0 })
                .send();
            expect(result?.version).toBe('legacy');
        });
        it('leaves the `u32` fields of `transactionConfig` as numbers but upcasts `priorityFee`', async () => {
            expect.assertions(4);
            const rpc = createMockRpc<GetTransactionApi>({
                meta: null,
                slot: 1,
                transaction: { message: { transactionConfig: MOCK_TRANSACTION_CONFIG } },
                version: 1,
            });
            const result = await rpc
                .getTransaction(MOCK_SIGNATURE, { encoding: 'json', maxSupportedTransactionVersion: 1 })
                .send();
            const transactionConfig = result?.transaction.message.transactionConfig;
            expect(transactionConfig?.computeUnitLimit).toBe(20_000);
            expect(transactionConfig?.heapSize).toBe(32_768);
            expect(transactionConfig?.loadedAccountsDataSizeLimit).toBe(65_536);
            expect(transactionConfig?.priorityFee).toBe(5_000n);
        });
        it('leaves token balance `decimals` and `uiAmount` as numbers', async () => {
            expect.assertions(2);
            const rpc = createMockRpc<GetTransactionApi>({
                meta: { postTokenBalances: [MOCK_TOKEN_BALANCE], preTokenBalances: [MOCK_TOKEN_BALANCE] },
                slot: 1,
            });
            const result = await rpc
                .getTransaction(MOCK_SIGNATURE, { encoding: 'json', maxSupportedTransactionVersion: 0 })
                .send();
            expect(result?.meta?.preTokenBalances?.[0].uiTokenAmount).toMatchObject({ decimals: 9, uiAmount: 1 });
            expect(result?.meta?.postTokenBalances?.[0].uiTokenAmount).toMatchObject({ decimals: 9, uiAmount: 1 });
        });
    });

    describe('getBlock', () => {
        it('leaves the `version` of each transaction as a number', async () => {
            expect.assertions(1);
            const rpc = createMockRpc<GetBlockApi>({
                blockhash: '4nHvMbxHURt2AXd7yQpKSKM5XCVKQiNbfsFmvPtHNJnJ',
                transactions: [{ meta: null, version: 0 }],
            });
            const result = await rpc.getBlock(1n, { encoding: 'json', maxSupportedTransactionVersion: 0 }).send();
            expect(result?.transactions[0].version).toBe(0);
        });
        it('leaves the `u32` fields of `transactionConfig` as numbers but upcasts `priorityFee`', async () => {
            expect.assertions(4);
            const rpc = createMockRpc<GetBlockApi>({
                blockhash: '4nHvMbxHURt2AXd7yQpKSKM5XCVKQiNbfsFmvPtHNJnJ',
                transactions: [
                    {
                        meta: null,
                        transaction: { message: { transactionConfig: MOCK_TRANSACTION_CONFIG } },
                        version: 1,
                    },
                ],
            });
            const result = await rpc.getBlock(1n, { encoding: 'json', maxSupportedTransactionVersion: 1 }).send();
            const transactionConfig = result?.transactions[0].transaction.message.transactionConfig;
            expect(transactionConfig?.computeUnitLimit).toBe(20_000);
            expect(transactionConfig?.heapSize).toBe(32_768);
            expect(transactionConfig?.loadedAccountsDataSizeLimit).toBe(65_536);
            expect(transactionConfig?.priorityFee).toBe(5_000n);
        });
        it('leaves token balance `decimals` and `uiAmount` as numbers', async () => {
            expect.assertions(1);
            const rpc = createMockRpc<GetBlockApi>({
                blockhash: '4nHvMbxHURt2AXd7yQpKSKM5XCVKQiNbfsFmvPtHNJnJ',
                transactions: [{ meta: { preTokenBalances: [MOCK_TOKEN_BALANCE] } }],
            });
            const result = await rpc.getBlock(1n, { encoding: 'json', maxSupportedTransactionVersion: 0 }).send();
            expect(result?.transactions[0].meta?.preTokenBalances?.[0].uiTokenAmount).toMatchObject({
                decimals: 9,
                uiAmount: 1,
            });
        });
    });

    describe('getTransactionsForAddress', () => {
        it('leaves the `version` of each transaction as a number', async () => {
            expect.assertions(1);
            const rpc = createMockRpc<GetTransactionsForAddressApi>({
                data: [{ meta: null, version: 0 }],
            });
            const result = await rpc
                .getTransactionsForAddress('11111111111111111111111111111111' as Address, {
                    encoding: 'json',
                    maxSupportedTransactionVersion: 0,
                    transactionDetails: 'full',
                })
                .send();
            expect(result.data[0].version).toBe(0);
        });
        it('leaves token balance `decimals` and `uiAmount` as numbers', async () => {
            expect.assertions(2);
            const rpc = createMockRpc<GetTransactionsForAddressApi>({
                data: [{ meta: { postTokenBalances: [MOCK_TOKEN_BALANCE], preTokenBalances: [MOCK_TOKEN_BALANCE] } }],
            });
            const result = await rpc
                .getTransactionsForAddress('11111111111111111111111111111111' as Address, {
                    encoding: 'json',
                    maxSupportedTransactionVersion: 0,
                    transactionDetails: 'full',
                })
                .send();
            expect(result.data[0].meta?.preTokenBalances?.[0].uiTokenAmount).toMatchObject({
                decimals: 9,
                uiAmount: 1,
            });
            expect(result.data[0].meta?.postTokenBalances?.[0].uiTokenAmount).toMatchObject({
                decimals: 9,
                uiAmount: 1,
            });
        });
    });

    describe('simulateTransaction', () => {
        it('leaves token balance `accountIndex`, `decimals` and `uiAmount` as numbers', async () => {
            expect.assertions(2);
            const rpc = createMockRpc<SimulateTransactionApi>({
                context: { slot: 1 },
                value: { postTokenBalances: [MOCK_TOKEN_BALANCE], preTokenBalances: [MOCK_TOKEN_BALANCE] },
            });
            const result = await rpc.simulateTransaction('' as never, { encoding: 'base64' as const }).send();
            expect(result.value.preTokenBalances?.[0]).toMatchObject({
                accountIndex: 1,
                uiTokenAmount: { decimals: 9, uiAmount: 1 },
            });
            expect(result.value.postTokenBalances?.[0]).toMatchObject({
                accountIndex: 1,
                uiTokenAmount: { decimals: 9, uiAmount: 1 },
            });
        });
    });
});
