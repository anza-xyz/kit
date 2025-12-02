import type { Lamports } from '@solana/rpc-types';

import { getMinimumBalanceForRentExemption } from '../get-minimum-balance-for-rent-exemption';

describe('getMinimumBalanceForRentExemption', () => {
    it.each`
        space     | lamports
        ${0n}     | ${890_880n}
        ${100n}   | ${890_880n + 100n * 3_480n * 2n}
        ${1_024n} | ${890_880n + 1_024n * 3_480n * 2n}
    `('calculates the correct rent for an account with $space bytes of space allocated', ({ space, lamports }) => {
        expect.assertions(1);
        expect(getMinimumBalanceForRentExemption(space)).toBe(lamports as unknown as Lamports);
    });
});
