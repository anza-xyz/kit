import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';

import { assertIsClientWithIdentity, isClientWithIdentity } from '../identity';

describe('isClientWithIdentity', () => {
    it('returns true when the client has an identity', () => {
        expect(isClientWithIdentity({ identity: {} })).toBe(true);
    });
    it('returns false when the client has no identity', () => {
        expect(isClientWithIdentity({})).toBe(false);
    });
    it('does not read the identity', () => {
        const getIdentity = jest.fn().mockImplementation(() => {
            throw new Error('not implemented');
        });
        const client = Object.defineProperty({}, 'identity', { get: getIdentity });
        expect(isClientWithIdentity(client)).toBe(true);
        expect(getIdentity).not.toHaveBeenCalled();
    });
});

describe('assertIsClientWithIdentity', () => {
    it('does not throw when the client has an identity', () => {
        expect(() => assertIsClientWithIdentity({ identity: {} })).not.toThrow();
    });
    it('throws when the client has no identity', () => {
        expect(() => assertIsClientWithIdentity({})).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
                capabilities: ['identity'],
            }),
        );
    });
});
