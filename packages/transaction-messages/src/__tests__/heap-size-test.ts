import '@solana/test-matchers/toBeFrozenObject';

import { setTransactionMessageHeapSize } from '../heap-size';
import { TransactionMessage } from '../transaction-message';

const COMPUTE_UNIT_LIMIT_A = 200_000;

const HEAP_SIZE_A = 30_000;
const HEAP_SIZE_B = 50_000;

const PRIORITY_FEE_LAMPORTS_A = 5_000n;

const baseTx: TransactionMessage & { version: 1 } = {
    instructions: [],
    version: 1,
};

describe('setTransactionMessageHeapSize', () => {
    it('sets the heap size on the transaction', () => {
        const txWithHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
        expect(txWithHeapSize).toHaveProperty('config', { heapSize: HEAP_SIZE_A });
    });

    it('freezes the transaction object', () => {
        const txWithHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
        expect(txWithHeapSize).toBeFrozenObject();
    });

    it('freezes the config object', () => {
        const txWithHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
        expect(txWithHeapSize.config).toBeFrozenObject();
    });

    describe('given a transaction with an existing config', () => {
        const txWithConfig = {
            ...baseTx,
            config: {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
            },
        };

        it('sets the heap size while preserving other config properties', () => {
            const txWithHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, txWithConfig);
            expect(txWithHeapSize.config).toMatchObject({
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
                priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
            });
        });

        it('returns the same reference when setting the same heap size', () => {
            const txWithHeapSizeA = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
            const txWithSameHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, txWithHeapSizeA);
            expect(txWithHeapSizeA).toBe(txWithSameHeapSize);
        });

        it('returns a new reference when setting a different heap size', () => {
            const txWithHeapSizeA = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
            const txWithHeapSizeB = setTransactionMessageHeapSize(HEAP_SIZE_B, txWithHeapSizeA);
            expect(txWithHeapSizeA).not.toBe(txWithHeapSizeB);
            expect(txWithHeapSizeB.config).toHaveProperty('heapSize', HEAP_SIZE_B);
        });
    });

    describe('empty config normalization', () => {
        it('removes config when setting to undefined as only property', () => {
            const txWithHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
            const txWithoutConfig = setTransactionMessageHeapSize(undefined, txWithHeapSize);
            expect(txWithoutConfig).not.toHaveProperty('config');
        });

        it('preserves config when setting to undefined with other properties present', () => {
            const txWithConfig = {
                ...baseTx,
                config: {
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    heapSize: HEAP_SIZE_A,
                },
            };
            const txWithoutHeapSize = setTransactionMessageHeapSize(undefined, txWithConfig);
            expect(txWithoutHeapSize).toHaveProperty('config', {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: undefined,
            });
        });
    });
});
