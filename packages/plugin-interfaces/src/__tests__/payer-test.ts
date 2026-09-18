import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';

import { assertIsClientWithPayer, isClientWithPayer } from '../payer';

describe('isClientWithPayer', () => {
    it('returns true when the client has a payer', () => {
        expect(isClientWithPayer({ payer: {} })).toBe(true);
    });
    it('returns false when the client has no payer', () => {
        expect(isClientWithPayer({})).toBe(false);
    });
    it('returns false when the payer is only inherited from the prototype', () => {
        expect(isClientWithPayer(Object.create({ payer: {} }) as object)).toBe(false);
    });
    it('does not read the payer', () => {
        const getPayer = jest.fn().mockImplementation(() => {
            throw new Error('not implemented');
        });
        const client = Object.defineProperty({}, 'payer', { get: getPayer });
        expect(isClientWithPayer(client)).toBe(true);
        expect(getPayer).not.toHaveBeenCalled();
    });
});

describe('assertIsClientWithPayer', () => {
    it('does not throw when the client has a payer', () => {
        expect(() => assertIsClientWithPayer({ payer: {} })).not.toThrow();
    });
    it('throws when the client has no payer', () => {
        expect(() => assertIsClientWithPayer({})).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, { capabilities: ['payer'] }),
        );
    });
});
