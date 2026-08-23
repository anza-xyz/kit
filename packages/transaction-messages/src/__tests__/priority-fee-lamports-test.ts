import '@solana/test-matchers/toBeFrozenObject';

import {
    getTransactionMessagePriorityFeeLamports,
    setTransactionMessagePriorityFeeLamports,
} from '../priority-fee-lamports';
import { TransactionMessage } from '../transaction-message';

const COMPUTE_UNIT_LIMIT_A = 200_000;
const HEAP_SIZE_A = 30_000;

const PRIORITY_FEE_LAMPORTS_A = 5_000n;
const PRIORITY_FEE_LAMPORTS_B = 10_000n;

describe('setTransactionMessagePriorityFeeLamports', () => {
    describe('given a v1 transaction', () => {
        const baseTx: TransactionMessage & { version: 1 } = { instructions: [], version: 1 };

        it('sets the priority fee lamports on the transaction', () => {
            const txWithFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
            expect(txWithFee).toHaveProperty('config', { priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A });
        });

        it('freezes the transaction object', () => {
            const txWithFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
            expect(txWithFee).toBeFrozenObject();
        });

        it('freezes the config object', () => {
            const txWithFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
            expect(txWithFee.config).toBeFrozenObject();
        });

        describe('given a transaction with an existing config', () => {
            const txWithConfig = {
                ...baseTx,
                config: {
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    heapSize: HEAP_SIZE_A,
                },
            };

            it('sets the priority fee lamports while preserving other config properties', () => {
                const txWithFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, txWithConfig);
                expect(txWithFee.config).toMatchObject({
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    heapSize: HEAP_SIZE_A,
                    priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
                });
            });

            it('returns the same reference when setting the same priority fee lamports', () => {
                const txWithFeeA = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
                const txWithSameFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, txWithFeeA);
                expect(txWithFeeA).toBe(txWithSameFee);
            });

            it('returns a new reference when setting different priority fee lamports', () => {
                const txWithFeeA = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
                const txWithFeeB = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_B, txWithFeeA);
                expect(txWithFeeA).not.toBe(txWithFeeB);
                expect(txWithFeeB.config).toHaveProperty('priorityFeeLamports', PRIORITY_FEE_LAMPORTS_B);
            });
        });

        describe('empty config normalization', () => {
            it('removes config when setting to undefined as only property', () => {
                const txWithFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
                const txWithoutConfig = setTransactionMessagePriorityFeeLamports(undefined, txWithFee);
                expect(txWithoutConfig).not.toHaveProperty('config');
            });

            it('preserves config when setting to undefined with other properties present', () => {
                const txWithConfig = {
                    ...baseTx,
                    config: {
                        computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                        priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
                    },
                };
                const txWithoutFee = setTransactionMessagePriorityFeeLamports(undefined, txWithConfig);
                expect(txWithoutFee).toHaveProperty('config', {
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    priorityFeeLamports: undefined,
                });
            });
        });
    });
});

describe('getTransactionMessagePriorityFeeLamports', () => {
    describe('given a v1 transaction', () => {
        it('returns undefined without config', () => {
            const tx: TransactionMessage & { version: 1 } = { instructions: [], version: 1 };
            expect(getTransactionMessagePriorityFeeLamports(tx)).toBeUndefined();
        });

        it('returns the value from config', () => {
            const tx: TransactionMessage & { version: 1 } = {
                config: { priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A },
                instructions: [],
                version: 1,
            };
            expect(getTransactionMessagePriorityFeeLamports(tx)).toBe(PRIORITY_FEE_LAMPORTS_A);
        });
    });
});
