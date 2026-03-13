import '@solana/test-matchers/toBeFrozenObject';

import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    getComputeUnitLimitFromInstructionData,
    getHeapSizeFromInstructionData,
    getLoadedAccountsDataSizeLimitFromInstructionData,
    getPriorityFeeFromInstructionData,
    getRequestHeapFrameInstruction,
    getSetComputeUnitLimitInstruction,
    getSetComputeUnitPriceInstruction,
    getSetLoadedAccountsDataSizeLimitInstruction,
    isRequestHeapFrameInstruction,
    isSetComputeUnitLimitInstruction,
    isSetComputeUnitPriceInstruction,
    isSetLoadedAccountsDataSizeLimitInstruction,
} from '../compute-budget-instruction';

describe('SetComputeUnitLimit', () => {
    describe('getSetComputeUnitLimitInstruction', () => {
        it('creates an instruction with the correct program address', () => {
            const ix = getSetComputeUnitLimitInstruction(200_000);
            expect(ix.programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
        });

        it('creates an instruction with discriminator 2 and u32 value', () => {
            const ix = getSetComputeUnitLimitInstruction(200_000);
            expect(ix.data[0]).toBe(2);
            expect(ix.data.byteLength).toBe(5); // 1 byte discriminator + 4 bytes u32
        });

        it('encodes the value correctly', () => {
            const ix = getSetComputeUnitLimitInstruction(200_000);
            expect(getComputeUnitLimitFromInstructionData(ix.data)).toBe(200_000);
        });
    });

    describe('isSetComputeUnitLimitInstruction', () => {
        it('returns true for a SetComputeUnitLimit instruction', () => {
            const ix = getSetComputeUnitLimitInstruction(200_000);
            expect(isSetComputeUnitLimitInstruction(ix)).toBe(true);
        });

        it('returns false for a different compute budget instruction', () => {
            const ix = getSetComputeUnitPriceInstruction(100n);
            expect(isSetComputeUnitLimitInstruction(ix)).toBe(false);
        });
    });
});

describe('SetComputeUnitPrice', () => {
    describe('getSetComputeUnitPriceInstruction', () => {
        it('creates an instruction with the correct program address', () => {
            const ix = getSetComputeUnitPriceInstruction(100n);
            expect(ix.programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
        });

        it('creates an instruction with discriminator 3 and u64 value', () => {
            const ix = getSetComputeUnitPriceInstruction(100n);
            expect(ix.data[0]).toBe(3);
            expect(ix.data.byteLength).toBe(9); // 1 byte discriminator + 8 bytes u64
        });

        it('encodes the value correctly', () => {
            const ix = getSetComputeUnitPriceInstruction(5_000n);
            expect(getPriorityFeeFromInstructionData(ix.data)).toBe(5_000n);
        });

        it('handles zero', () => {
            const ix = getSetComputeUnitPriceInstruction(0n);
            expect(getPriorityFeeFromInstructionData(ix.data)).toBe(0n);
        });

        it('handles large u64 values', () => {
            const largeValue = 2n ** 63n;
            const ix = getSetComputeUnitPriceInstruction(largeValue);
            expect(getPriorityFeeFromInstructionData(ix.data)).toBe(largeValue);
        });
    });

    describe('isSetComputeUnitPriceInstruction', () => {
        it('returns true for a SetComputeUnitPrice instruction', () => {
            const ix = getSetComputeUnitPriceInstruction(100n);
            expect(isSetComputeUnitPriceInstruction(ix)).toBe(true);
        });

        it('returns false for a different compute budget instruction', () => {
            const ix = getSetComputeUnitLimitInstruction(200_000);
            expect(isSetComputeUnitPriceInstruction(ix)).toBe(false);
        });
    });
});

describe('RequestHeapFrame', () => {
    describe('getRequestHeapFrameInstruction', () => {
        it('creates an instruction with the correct program address', () => {
            const ix = getRequestHeapFrameInstruction(256_000);
            expect(ix.programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
        });

        it('creates an instruction with discriminator 1 and u32 value', () => {
            const ix = getRequestHeapFrameInstruction(256_000);
            expect(ix.data[0]).toBe(1);
            expect(ix.data.byteLength).toBe(5); // 1 byte discriminator + 4 bytes u32
        });

        it('encodes the value correctly', () => {
            const ix = getRequestHeapFrameInstruction(256_000);
            expect(getHeapSizeFromInstructionData(ix.data)).toBe(256_000);
        });
    });

    describe('isRequestHeapFrameInstruction', () => {
        it('returns true for a RequestHeapFrame instruction', () => {
            const ix = getRequestHeapFrameInstruction(256_000);
            expect(isRequestHeapFrameInstruction(ix)).toBe(true);
        });

        it('returns false for a different compute budget instruction', () => {
            const ix = getSetComputeUnitLimitInstruction(200_000);
            expect(isRequestHeapFrameInstruction(ix)).toBe(false);
        });
    });
});

describe('SetLoadedAccountsDataSizeLimit', () => {
    describe('getSetLoadedAccountsDataSizeLimitInstruction', () => {
        it('creates an instruction with the correct program address', () => {
            const ix = getSetLoadedAccountsDataSizeLimitInstruction(64_000);
            expect(ix.programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
        });

        it('creates an instruction with discriminator 4 and u32 value', () => {
            const ix = getSetLoadedAccountsDataSizeLimitInstruction(64_000);
            expect(ix.data[0]).toBe(4);
            expect(ix.data.byteLength).toBe(5); // 1 byte discriminator + 4 bytes u32
        });

        it('encodes the value correctly', () => {
            const ix = getSetLoadedAccountsDataSizeLimitInstruction(64_000);
            expect(getLoadedAccountsDataSizeLimitFromInstructionData(ix.data)).toBe(64_000);
        });
    });

    describe('isSetLoadedAccountsDataSizeLimitInstruction', () => {
        it('returns true for a SetLoadedAccountsDataSizeLimit instruction', () => {
            const ix = getSetLoadedAccountsDataSizeLimitInstruction(64_000);
            expect(isSetLoadedAccountsDataSizeLimitInstruction(ix)).toBe(true);
        });

        it('returns false for a different compute budget instruction', () => {
            const ix = getSetComputeUnitLimitInstruction(200_000);
            expect(isSetLoadedAccountsDataSizeLimitInstruction(ix)).toBe(false);
        });
    });
});
