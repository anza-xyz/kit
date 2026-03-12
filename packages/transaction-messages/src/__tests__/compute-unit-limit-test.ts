import '@solana/test-matchers/toBeFrozenObject';

import { setTransactionMessageComputeUnitLimit } from '../compute-unit-limit';
import { TransactionMessage } from '../transaction-message';

const COMPUTE_UNIT_LIMIT_A = 200_000;
const COMPUTE_UNIT_LIMIT_B = 400_000;

const baseTx: TransactionMessage & { version: 1 } = {
    instructions: [],
    version: 1,
};

describe('setTransactionMessageComputeUnitLimit', () => {
    it('sets the compute unit limit on the transaction', () => {
        const txWithLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
        expect(txWithLimit).toHaveProperty('config', { computeUnitLimit: COMPUTE_UNIT_LIMIT_A });
    });

    it('freezes the transaction object', () => {
        const txWithLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
        expect(txWithLimit).toBeFrozenObject();
    });

    it('freezes the config object', () => {
        const txWithLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
        expect(txWithLimit.config).toBeFrozenObject();
    });

    describe('given a transaction with an existing config', () => {
        const txWithConfig = {
            ...baseTx,
            config: {
                heapSize: 1_000,
                priorityFeeLamports: 5_000n,
            },
        };

        it('sets the compute unit limit while preserving other config properties', () => {
            const txWithLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, txWithConfig);
            expect(txWithLimit.config).toMatchObject({
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: 1_000,
                priorityFeeLamports: 5_000n,
            });
        });

        it('returns the same reference when setting the same compute unit limit', () => {
            const txWithLimitA = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
            const txWithSameLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, txWithLimitA);
            expect(txWithLimitA).toBe(txWithSameLimit);
        });

        it('returns a new reference when setting a different compute unit limit', () => {
            const txWithLimitA = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
            const txWithLimitB = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_B, txWithLimitA);
            expect(txWithLimitA).not.toBe(txWithLimitB);
            expect(txWithLimitB.config).toHaveProperty('computeUnitLimit', COMPUTE_UNIT_LIMIT_B);
        });
    });

    describe('empty config normalization', () => {
        it('removes config when setting to undefined as only property', () => {
            const txWithLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
            const txWithoutConfig = setTransactionMessageComputeUnitLimit(undefined, txWithLimit);
            expect(txWithoutConfig).not.toHaveProperty('config');
        });

        it('preserves config when setting to undefined with other properties present', () => {
            const txWithConfig = {
                ...baseTx,
                config: {
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    heapSize: 1_000,
                },
            };
            const txWithoutLimit = setTransactionMessageComputeUnitLimit(undefined, txWithConfig);
            expect(txWithoutLimit).toHaveProperty('config', {
                computeUnitLimit: undefined,
                heapSize: 1_000,
            });
        });
    });
});
