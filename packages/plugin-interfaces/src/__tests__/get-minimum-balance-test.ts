import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';

import { assertIsClientWithGetMinimumBalance, isClientWithGetMinimumBalance } from '../get-minimum-balance';

const getMinimumBalance = jest.fn().mockRejectedValue(new Error('not implemented'));

describe('isClientWithGetMinimumBalance', () => {
    it('returns true when the client has a getMinimumBalance function', () => {
        expect(isClientWithGetMinimumBalance({ getMinimumBalance })).toBe(true);
    });
    it('returns false when the client has no getMinimumBalance function', () => {
        expect(isClientWithGetMinimumBalance({})).toBe(false);
    });
});

describe('assertIsClientWithGetMinimumBalance', () => {
    it('does not throw when the client has a getMinimumBalance function', () => {
        expect(() => assertIsClientWithGetMinimumBalance({ getMinimumBalance })).not.toThrow();
    });
    it('throws when the client has no getMinimumBalance function', () => {
        expect(() => assertIsClientWithGetMinimumBalance({})).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
                capabilities: ['getMinimumBalance'],
            }),
        );
    });
});
