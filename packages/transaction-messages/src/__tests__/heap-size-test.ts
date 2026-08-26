import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, SolanaError } from '@solana/errors';

import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    getHeapSizeFromInstructionData,
    getRequestHeapFrameInstruction,
    HEAP_FRAME_SIZE_MULTIPLE,
    MAX_HEAP_FRAME_SIZE,
    MIN_HEAP_FRAME_SIZE,
} from '../compute-budget-instruction';
import { getTransactionMessageHeapSize, setTransactionMessageHeapSize } from '../heap-size';
import { assertIsValidHeapSize } from '../resource-limit-validation';
import { TransactionMessage } from '../transaction-message';

const MIN_HEAP_SIZE = MIN_HEAP_FRAME_SIZE;
const MAX_HEAP_SIZE = MAX_HEAP_FRAME_SIZE;

const COMPUTE_UNIT_LIMIT_A = 200_000;

const HEAP_SIZE_A = 32_768;
const HEAP_SIZE_B = 65_536;

const PRIORITY_FEE_LAMPORTS_A = 5_000n;

describe('setTransactionMessageHeapSize', () => {
    describe('given a v1 transaction', () => {
        const baseTx: TransactionMessage & { version: 1 } = { instructions: [], version: 1 };

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

    describe.each([{ version: 'legacy' as const }, { version: 0 as const }])(
        'given a $version transaction',
        ({ version }) => {
            const baseTx: TransactionMessage = { instructions: [], version };

            it('appends a RequestHeapFrame instruction', () => {
                const result = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
                expect(result.instructions).toHaveLength(1);
                expect(result.instructions[0].programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
                expect(getHeapSizeFromInstructionData(result.instructions[0].data as Uint8Array)).toBe(HEAP_SIZE_A);
            });

            it('freezes the transaction object', () => {
                const result = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
                expect(result).toBeFrozenObject();
            });

            it('freezes the instructions array', () => {
                const result = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
                expect(result.instructions).toBeFrozenObject();
            });

            it('appends the instruction after existing instructions', () => {
                const existingIx = { programAddress: '11111111111111111111111111111111' as Address };
                const txWithIx: TransactionMessage = { instructions: [existingIx], version };
                const result = setTransactionMessageHeapSize(HEAP_SIZE_A, txWithIx);
                expect(result.instructions).toHaveLength(2);
                expect(result.instructions[0]).toBe(existingIx);
                expect(result.instructions[1].programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
            });

            describe('given a transaction with an existing RequestHeapFrame instruction', () => {
                const existingIx = Object.freeze(getRequestHeapFrameInstruction(HEAP_SIZE_A));
                const otherIx = Object.freeze({ programAddress: '11111111111111111111111111111111' as Address });
                const txWithExisting = { instructions: [otherIx, existingIx] as const, version };

                it('replaces the existing instruction in-place when setting a different value', () => {
                    const result = setTransactionMessageHeapSize(HEAP_SIZE_B, txWithExisting);
                    expect(result.instructions).toHaveLength(2);
                    expect(result.instructions[0]).toBe(otherIx);
                    expect(getHeapSizeFromInstructionData(result.instructions[1].data)).toBe(HEAP_SIZE_B);
                });

                it('returns the same reference when setting the same value', () => {
                    const result = setTransactionMessageHeapSize(HEAP_SIZE_A, txWithExisting);
                    expect(result).toBe(txWithExisting);
                });

                it('returns a new reference when setting a different value', () => {
                    const result = setTransactionMessageHeapSize(HEAP_SIZE_B, txWithExisting);
                    expect(result).not.toBe(txWithExisting);
                });
            });

            describe('setting to undefined', () => {
                it('returns the same reference when no instruction exists', () => {
                    const result = setTransactionMessageHeapSize(undefined, baseTx);
                    expect(result).toBe(baseTx);
                });

                it('removes the instruction when one exists', () => {
                    const txWithIx = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
                    const result = setTransactionMessageHeapSize(undefined, txWithIx);
                    expect(result.instructions).toHaveLength(0);
                });

                it('preserves other instructions when removing', () => {
                    const otherIx = { programAddress: '11111111111111111111111111111111' as Address };
                    const heapIx = getRequestHeapFrameInstruction(HEAP_SIZE_A);
                    const txWithIxs: TransactionMessage = {
                        instructions: [heapIx, otherIx],
                        version,
                    };
                    const result = setTransactionMessageHeapSize(undefined, txWithIxs);
                    expect(result.instructions).toHaveLength(1);
                    expect(result.instructions[0]).toBe(otherIx);
                });
            });
        },
    );
});

describe('setTransactionMessageHeapSize validation', () => {
    describe.each([{ version: 'legacy' as const }, { version: 0 as const }, { version: 1 as const }])(
        'given a $version transaction',
        ({ version }) => {
            const baseTx = { instructions: [], version } as TransactionMessage & { version: 1 };

            it('throws when heap size is below the minimum', () => {
                expect(() => setTransactionMessageHeapSize(MIN_HEAP_SIZE - 1024, baseTx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
                        heapSize: MIN_HEAP_SIZE - 1024,
                        maxHeapSize: MAX_HEAP_SIZE,
                        minHeapSize: MIN_HEAP_SIZE,
                        multipleOf: HEAP_FRAME_SIZE_MULTIPLE,
                    }),
                );
            });

            it('succeeds when heap size equals the minimum', () => {
                const result = setTransactionMessageHeapSize(MIN_HEAP_SIZE, baseTx);
                expect(getTransactionMessageHeapSize(result)).toBe(MIN_HEAP_SIZE);
            });

            it('throws when heap size is one above the minimum but not a multiple', () => {
                expect(() => setTransactionMessageHeapSize(MIN_HEAP_SIZE + 1, baseTx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
                        heapSize: MIN_HEAP_SIZE + 1,
                        maxHeapSize: MAX_HEAP_SIZE,
                        minHeapSize: MIN_HEAP_SIZE,
                        multipleOf: HEAP_FRAME_SIZE_MULTIPLE,
                    }),
                );
            });

            it('succeeds when heap size equals the maximum', () => {
                const result = setTransactionMessageHeapSize(MAX_HEAP_SIZE, baseTx);
                expect(getTransactionMessageHeapSize(result)).toBe(MAX_HEAP_SIZE);
            });

            it('throws when heap size is above the maximum', () => {
                expect(() => setTransactionMessageHeapSize(MAX_HEAP_SIZE + 1024, baseTx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
                        heapSize: MAX_HEAP_SIZE + 1024,
                        maxHeapSize: MAX_HEAP_SIZE,
                        minHeapSize: MIN_HEAP_SIZE,
                        multipleOf: HEAP_FRAME_SIZE_MULTIPLE,
                    }),
                );
            });

            it('throws for a non-integer heap size', () => {
                expect(() => setTransactionMessageHeapSize(32768.5, baseTx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
                        heapSize: 32768.5,
                        maxHeapSize: MAX_HEAP_SIZE,
                        minHeapSize: MIN_HEAP_SIZE,
                        multipleOf: HEAP_FRAME_SIZE_MULTIPLE,
                    }),
                );
            });

            it('throws for NaN', () => {
                expect(() => setTransactionMessageHeapSize(NaN, baseTx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
                        heapSize: NaN,
                        maxHeapSize: MAX_HEAP_SIZE,
                        minHeapSize: MIN_HEAP_SIZE,
                        multipleOf: HEAP_FRAME_SIZE_MULTIPLE,
                    }),
                );
            });

            it('throws for Infinity', () => {
                expect(() => setTransactionMessageHeapSize(Infinity, baseTx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
                        heapSize: Infinity,
                        maxHeapSize: MAX_HEAP_SIZE,
                        minHeapSize: MIN_HEAP_SIZE,
                        multipleOf: HEAP_FRAME_SIZE_MULTIPLE,
                    }),
                );
            });

            it('throws for -Infinity', () => {
                expect(() => setTransactionMessageHeapSize(-Infinity, baseTx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
                        heapSize: -Infinity,
                        maxHeapSize: MAX_HEAP_SIZE,
                        minHeapSize: MIN_HEAP_SIZE,
                        multipleOf: HEAP_FRAME_SIZE_MULTIPLE,
                    }),
                );
            });

            it('succeeds and preserves removal behavior when heap size is undefined', () => {
                const result = setTransactionMessageHeapSize(undefined, baseTx);
                expect(getTransactionMessageHeapSize(result)).toBeUndefined();
            });

            it('does not mutate the message when validation fails', () => {
                expect(() => setTransactionMessageHeapSize(MIN_HEAP_SIZE - 1024, baseTx)).toThrow();
                expect(getTransactionMessageHeapSize(baseTx)).toBeUndefined();
            });
        },
    );
});

describe('getTransactionMessageHeapSize', () => {
    describe('given a v1 transaction', () => {
        it('returns undefined without config', () => {
            const tx: TransactionMessage = { instructions: [], version: 1 };
            expect(getTransactionMessageHeapSize(tx)).toBeUndefined();
        });

        it('returns the value from config', () => {
            const tx: TransactionMessage & { version: 1 } = {
                config: { heapSize: HEAP_SIZE_A },
                instructions: [],
                version: 1,
            };
            expect(getTransactionMessageHeapSize(tx)).toBe(HEAP_SIZE_A);
        });
    });

    describe.each([{ version: 'legacy' as const }, { version: 0 as const }])(
        'given a $version transaction',
        ({ version }) => {
            it('returns undefined without instruction', () => {
                const tx: TransactionMessage = { instructions: [], version };
                expect(getTransactionMessageHeapSize(tx)).toBeUndefined();
            });

            it('returns the value from instruction', () => {
                const tx: TransactionMessage = {
                    instructions: [getRequestHeapFrameInstruction(HEAP_SIZE_A)],
                    version,
                };
                expect(getTransactionMessageHeapSize(tx)).toBe(HEAP_SIZE_A);
            });
        },
    );
});

describe('assertIsValidHeapSize', () => {
    it('succeeds for the minimum heap size', () => {
        expect(() => assertIsValidHeapSize(MIN_HEAP_SIZE)).not.toThrow();
    });

    it('succeeds for the maximum heap size', () => {
        expect(() => assertIsValidHeapSize(MAX_HEAP_SIZE)).not.toThrow();
    });

    it('throws for a heap size below the minimum', () => {
        expect(() => assertIsValidHeapSize(MIN_HEAP_SIZE - 1024)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
                heapSize: MIN_HEAP_SIZE - 1024,
                maxHeapSize: MAX_HEAP_SIZE,
                minHeapSize: MIN_HEAP_SIZE,
                multipleOf: HEAP_FRAME_SIZE_MULTIPLE,
            }),
        );
    });

    it('throws for a non-multiple heap size', () => {
        expect(() => assertIsValidHeapSize(MIN_HEAP_SIZE + 1)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
                heapSize: MIN_HEAP_SIZE + 1,
                maxHeapSize: MAX_HEAP_SIZE,
                minHeapSize: MIN_HEAP_SIZE,
                multipleOf: HEAP_FRAME_SIZE_MULTIPLE,
            }),
        );
    });
});
