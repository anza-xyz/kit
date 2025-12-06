import { getMinimumBalanceForRentExemption } from '../get-minimum-balance-for-rent-exemption';

describe('getMinimumBalanceForRentExemption', () => {
    it('returns the expected rent exemption for an empty account', () => {
        expect.assertions(1);
        expect(getMinimumBalanceForRentExemption()).toBe(890_880n as unknown as ReturnType<typeof getMinimumBalanceForRentExemption>);
    });

    it('handles an explicit bigint data size', () => {
        expect.assertions(1);
        expect(getMinimumBalanceForRentExemption(100n)).toBe(
            1_586_880n as unknown as ReturnType<typeof getMinimumBalanceForRentExemption>,
        );
    });

    it('accepts number input for data size', () => {
        expect.assertions(1);
        expect(getMinimumBalanceForRentExemption(1_024)).toBe(
            8_017_920n as unknown as ReturnType<typeof getMinimumBalanceForRentExemption>,
        );
    });
});
