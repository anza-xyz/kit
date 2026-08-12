import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import { createRpc, type Rpc } from '@solana/rpc-spec';

import { createSolanaRpcApi, GetBlockApi, GetTransactionApi, GetTransactionsForAddressApi } from '../index';

const MOCK_SIGNATURE =
    '4nHvMbxHURt2AXd7yQpKSKM5XCVKQiNbfsFmvPtHNJnJPSJHFT6cGUUNQGYK3wcxDCTvBMTLpQFf6HGqhLTUsxwj' as Signature;

function createMockRpc<TApi>(result: unknown): Rpc<TApi> {
    return createRpc({
        api: createSolanaRpcApi<never>(),
        transport: jest.fn().mockResolvedValue({ result }),
    });
}

describe('the default response transformer for the Solana RPC', () => {
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
    });
});
