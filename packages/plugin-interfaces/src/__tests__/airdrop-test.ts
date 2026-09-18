import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';

import { assertIsClientWithAirdrop, isClientWithAirdrop } from '../airdrop';

const airdrop = jest.fn().mockRejectedValue(new Error('not implemented'));

describe('isClientWithAirdrop', () => {
    it('returns true when the client has an airdrop function', () => {
        expect(isClientWithAirdrop({ airdrop })).toBe(true);
    });
    it('returns false when the client has no airdrop function', () => {
        expect(isClientWithAirdrop({})).toBe(false);
    });
});

describe('assertIsClientWithAirdrop', () => {
    it('does not throw when the client has an airdrop function', () => {
        expect(() => assertIsClientWithAirdrop({ airdrop })).not.toThrow();
    });
    it('throws when the client has no airdrop function', () => {
        expect(() => assertIsClientWithAirdrop({})).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
                capabilities: ['airdrop'],
            }),
        );
    });
});
