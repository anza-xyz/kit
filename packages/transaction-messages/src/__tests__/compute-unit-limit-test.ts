import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';

import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    getComputeUnitLimitFromInstructionData,
    getSetComputeUnitLimitInstruction,
} from '../compute-budget-instruction';
import { getTransactionMessageComputeUnitLimit, setTransactionMessageComputeUnitLimit } from '../compute-unit-limit';
import { TransactionMessage } from '../transaction-message';

const COMPUTE_UNIT_LIMIT_A = 200_000;
const COMPUTE_UNIT_LIMIT_B = 400_000;

describe('setTransactionMessageComputeUnitLimit', () => {
    describe('given a v1 transaction', () => {
        const baseTx: TransactionMessage & { version: 1 } = { instructions: [], version: 1 };

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

    describe.each([{ version: 'legacy' as const }, { version: 0 as const }])(
        'given a $version transaction',
        ({ version }) => {
            const baseTx: TransactionMessage = { instructions: [], version };

            it('appends a SetComputeUnitLimit instruction', () => {
                const result = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
                expect(result.instructions).toHaveLength(1);
                expect(result.instructions[0].programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
                expect(getComputeUnitLimitFromInstructionData(result.instructions[0].data as Uint8Array)).toBe(
                    COMPUTE_UNIT_LIMIT_A,
                );
            });

            it('freezes the transaction object', () => {
                const result = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
                expect(result).toBeFrozenObject();
            });

            it('freezes the instructions array', () => {
                const result = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
                expect(result.instructions).toBeFrozenObject();
            });

            it('appends the instruction after existing instructions', () => {
                const existingIx = { programAddress: '11111111111111111111111111111111' as Address };
                const txWithIx: TransactionMessage = { instructions: [existingIx], version };
                const result = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, txWithIx);
                expect(result.instructions).toHaveLength(2);
                expect(result.instructions[0]).toBe(existingIx);
                expect(result.instructions[1].programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
            });

            describe('given a transaction with an existing SetComputeUnitLimit instruction', () => {
                const existingIx = Object.freeze(getSetComputeUnitLimitInstruction(COMPUTE_UNIT_LIMIT_A));
                const otherIx = Object.freeze({ programAddress: '11111111111111111111111111111111' as Address });
                const txWithExisting = { instructions: [otherIx, existingIx] as const, version };

                it('replaces the existing instruction in-place when setting a different value', () => {
                    const result = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_B, txWithExisting);
                    expect(result.instructions).toHaveLength(2);
                    expect(result.instructions[0]).toBe(otherIx);
                    expect(getComputeUnitLimitFromInstructionData(result.instructions[1].data)).toBe(
                        COMPUTE_UNIT_LIMIT_B,
                    );
                });

                it('returns the same reference when setting the same value', () => {
                    const result = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, txWithExisting);
                    expect(result).toBe(txWithExisting);
                });

                it('returns a new reference when setting a different value', () => {
                    const result = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_B, txWithExisting);
                    expect(result).not.toBe(txWithExisting);
                });
            });

            describe('setting to undefined', () => {
                it('returns the same reference when no instruction exists', () => {
                    const result = setTransactionMessageComputeUnitLimit(undefined, baseTx);
                    expect(result).toBe(baseTx);
                });

                it('removes the instruction when one exists', () => {
                    const txWithIx = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
                    const result = setTransactionMessageComputeUnitLimit(undefined, txWithIx);
                    expect(result.instructions).toHaveLength(0);
                });

                it('preserves other instructions when removing', () => {
                    const otherIx = { programAddress: '11111111111111111111111111111111' as Address };
                    const cuIx = getSetComputeUnitLimitInstruction(COMPUTE_UNIT_LIMIT_A);
                    const txWithIxs: TransactionMessage = {
                        instructions: [cuIx, otherIx],
                        version,
                    };
                    const result = setTransactionMessageComputeUnitLimit(undefined, txWithIxs);
                    expect(result.instructions).toHaveLength(1);
                    expect(result.instructions[0]).toBe(otherIx);
                });
            });
        },
    );
});

describe('getTransactionMessageComputeUnitLimit', () => {
    describe('given a v1 transaction', () => {
        it('returns undefined without config', () => {
            const tx: TransactionMessage = { instructions: [], version: 1 };
            expect(getTransactionMessageComputeUnitLimit(tx)).toBeUndefined();
        });

        it('returns the value from config', () => {
            const tx: TransactionMessage & { version: 1 } = {
                config: { computeUnitLimit: COMPUTE_UNIT_LIMIT_A },
                instructions: [],
                version: 1,
            };
            expect(getTransactionMessageComputeUnitLimit(tx)).toBe(COMPUTE_UNIT_LIMIT_A);
        });
    });

    describe.each([{ version: 'legacy' as const }, { version: 0 as const }])(
        'given a $version transaction',
        ({ version }) => {
            it('returns undefined without instruction', () => {
                const tx: TransactionMessage = { instructions: [], version };
                expect(getTransactionMessageComputeUnitLimit(tx)).toBeUndefined();
            });

            it('returns the value from instruction', () => {
                const tx: TransactionMessage = {
                    instructions: [getSetComputeUnitLimitInstruction(COMPUTE_UNIT_LIMIT_A)],
                    version,
                };
                expect(getTransactionMessageComputeUnitLimit(tx)).toBe(COMPUTE_UNIT_LIMIT_A);
            });
        },
    );
});
