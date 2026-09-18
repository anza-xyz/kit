import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';

import { assertIsClientWithFetchAccounts, isClientWithFetchAccounts } from '../fetch-accounts';

const fetchAccounts = jest.fn().mockRejectedValue(new Error('not implemented'));

describe('isClientWithFetchAccounts', () => {
    it('returns true when the client has a fetchAccounts function', () => {
        expect(isClientWithFetchAccounts({ fetchAccounts })).toBe(true);
    });
    it('returns false when the client has no fetchAccounts function', () => {
        expect(isClientWithFetchAccounts({})).toBe(false);
    });
});

describe('assertIsClientWithFetchAccounts', () => {
    it('does not throw when the client has a fetchAccounts function', () => {
        expect(() => assertIsClientWithFetchAccounts({ fetchAccounts })).not.toThrow();
    });
    it('throws when the client has no fetchAccounts function', () => {
        expect(() => assertIsClientWithFetchAccounts({})).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
                capabilities: ['fetchAccounts'],
            }),
        );
    });
});
