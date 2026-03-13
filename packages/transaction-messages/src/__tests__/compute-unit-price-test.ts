import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';

import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    getPriorityFeeFromInstructionData,
    getSetComputeUnitPriceInstruction,
} from '../compute-budget-instruction';
import { getTransactionMessageComputeUnitPrice, setTransactionMessageComputeUnitPrice } from '../compute-unit-price';
import { TransactionMessage } from '../transaction-message';

type LegacyOrV0TransactionMessage = Extract<TransactionMessage, { version: 'legacy' | 0 }>;

const COMPUTE_UNIT_PRICE_A = 5_000n;
const COMPUTE_UNIT_PRICE_B = 10_000n;

describe('setTransactionMessageComputeUnitPrice', () => {
    describe.each([{ version: 'legacy' as const }, { version: 0 as const }])(
        'given a $version transaction',
        ({ version }) => {
            const baseTx: LegacyOrV0TransactionMessage = { instructions: [], version };

            it('appends a SetComputeUnitPrice instruction', () => {
                const result = setTransactionMessageComputeUnitPrice(COMPUTE_UNIT_PRICE_A, baseTx);
                expect(result.instructions).toHaveLength(1);
                expect(result.instructions[0].programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
                expect(getPriorityFeeFromInstructionData(result.instructions[0].data as Uint8Array)).toBe(
                    COMPUTE_UNIT_PRICE_A,
                );
            });

            it('freezes the transaction object', () => {
                const result = setTransactionMessageComputeUnitPrice(COMPUTE_UNIT_PRICE_A, baseTx);
                expect(result).toBeFrozenObject();
            });

            it('freezes the instructions array', () => {
                const result = setTransactionMessageComputeUnitPrice(COMPUTE_UNIT_PRICE_A, baseTx);
                expect(result.instructions).toBeFrozenObject();
            });

            it('appends the instruction after existing instructions', () => {
                const existingIx = { programAddress: '11111111111111111111111111111111' as Address };
                const txWithIx: LegacyOrV0TransactionMessage = { instructions: [existingIx], version };
                const result = setTransactionMessageComputeUnitPrice(COMPUTE_UNIT_PRICE_A, txWithIx);
                expect(result.instructions).toHaveLength(2);
                expect(result.instructions[0]).toBe(existingIx);
                expect(result.instructions[1].programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
            });

            describe('given a transaction with an existing SetComputeUnitPrice instruction', () => {
                const existingIx = Object.freeze(getSetComputeUnitPriceInstruction(COMPUTE_UNIT_PRICE_A));
                const otherIx = Object.freeze({ programAddress: '11111111111111111111111111111111' as Address });
                const txWithExisting: LegacyOrV0TransactionMessage = {
                    instructions: [otherIx, existingIx],
                    version,
                };

                it('replaces the existing instruction in-place when setting a different value', () => {
                    const result = setTransactionMessageComputeUnitPrice(COMPUTE_UNIT_PRICE_B, txWithExisting);
                    expect(result.instructions).toHaveLength(2);
                    expect(result.instructions[0]).toBe(otherIx);
                    expect(getPriorityFeeFromInstructionData(result.instructions[1].data as Uint8Array)).toBe(
                        COMPUTE_UNIT_PRICE_B,
                    );
                });

                it('returns the same reference when setting the same value', () => {
                    const result = setTransactionMessageComputeUnitPrice(COMPUTE_UNIT_PRICE_A, txWithExisting);
                    expect(result).toBe(txWithExisting);
                });

                it('returns a new reference when setting a different value', () => {
                    const result = setTransactionMessageComputeUnitPrice(COMPUTE_UNIT_PRICE_B, txWithExisting);
                    expect(result).not.toBe(txWithExisting);
                });
            });

            describe('setting to undefined', () => {
                it('returns the same reference when no instruction exists', () => {
                    const result = setTransactionMessageComputeUnitPrice(undefined, baseTx);
                    expect(result).toBe(baseTx);
                });

                it('removes the instruction when one exists', () => {
                    const txWithIx = setTransactionMessageComputeUnitPrice(COMPUTE_UNIT_PRICE_A, baseTx);
                    const result = setTransactionMessageComputeUnitPrice(undefined, txWithIx);
                    expect(result.instructions).toHaveLength(0);
                });

                it('preserves other instructions when removing', () => {
                    const otherIx = { programAddress: '11111111111111111111111111111111' as Address };
                    const priceIx = getSetComputeUnitPriceInstruction(COMPUTE_UNIT_PRICE_A);
                    const txWithIxs: LegacyOrV0TransactionMessage = {
                        instructions: [priceIx, otherIx],
                        version,
                    };
                    const result = setTransactionMessageComputeUnitPrice(undefined, txWithIxs);
                    expect(result.instructions).toHaveLength(1);
                    expect(result.instructions[0]).toBe(otherIx);
                });
            });
        },
    );
});

describe('getTransactionMessageComputeUnitPrice', () => {
    describe.each([{ version: 'legacy' as const }, { version: 0 as const }])(
        'given a $version transaction',
        ({ version }) => {
            it('returns undefined without instruction', () => {
                const tx: LegacyOrV0TransactionMessage = { instructions: [], version };
                expect(getTransactionMessageComputeUnitPrice(tx)).toBeUndefined();
            });

            it('returns the value from instruction', () => {
                const tx: LegacyOrV0TransactionMessage = {
                    instructions: [getSetComputeUnitPriceInstruction(COMPUTE_UNIT_PRICE_A)],
                    version,
                };
                expect(getTransactionMessageComputeUnitPrice(tx)).toBe(COMPUTE_UNIT_PRICE_A);
            });
        },
    );
});
