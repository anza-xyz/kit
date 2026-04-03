import type { Lamports } from '@solana/rpc-types';

import { getMinimumBalanceForRentExemption } from '../get-minimum-balance-for-rent-exemption';

describe('getMinimumBalanceForRentExemption', () => {
    it.each`
        space     | lamports
        ${0n}     | ${890_880n}
        ${100n}   | ${890_880n + 100n * 6_960n}
        ${1_024n} | ${890_880n + 1_024n * 6_960n}
    `('calculates the correct rent for an account with $space bytes of space allocated', ({ space, lamports }) => {
        expect.assertions(1);
        expect(getMinimumBalanceForRentExemption(space)).toBe(lamports as unknown as Lamports);
    });
    it('produces 890,880 lamports for a zero-data account (128 * 6960)', () => {
        expect(getMinimumBalanceForRentExemption(0n)).toBe(890_880n as unknown as Lamports);
    });
    it('produces the same result as the old formula: (128 + space) * 3480 * 2', () => {
        const space = 200n;
        const oldFormula = (128n + space) * 3_480n * 2n;
        const newResult = getMinimumBalanceForRentExemption(space);
        expect(newResult).toBe(oldFormula as unknown as Lamports);
    });
    it('uses DEFAULT_LAMPORTS_PER_BYTE of 6960 (doubled from 3480 per SIMD-0194)', () => {
        const space = 1n;
        // (128 + 1) * 6960 = 129 * 6960 = 897_840
        expect(getMinimumBalanceForRentExemption(space)).toBe(897_840n as unknown as Lamports);
    });
});
