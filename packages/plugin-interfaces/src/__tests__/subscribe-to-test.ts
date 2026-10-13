import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';

import {
    assertIsClientWithSubscribeToIdentity,
    assertIsClientWithSubscribeToPayer,
    isClientWithSubscribeToIdentity,
    isClientWithSubscribeToPayer,
} from '../subscribe-to';

const subscribe = jest.fn().mockImplementation(() => {
    throw new Error('not implemented');
});

describe('isClientWithSubscribeToPayer', () => {
    it('returns true when the client has a subscribeToPayer function', () => {
        expect(isClientWithSubscribeToPayer({ subscribeToPayer: subscribe })).toBe(true);
    });
    it('returns false when the client has no subscribeToPayer function', () => {
        expect(isClientWithSubscribeToPayer({})).toBe(false);
    });
    it('returns false when the client only has a subscribeToIdentity function', () => {
        expect(isClientWithSubscribeToPayer({ subscribeToIdentity: subscribe })).toBe(false);
    });
});

describe('assertIsClientWithSubscribeToPayer', () => {
    it('does not throw when the client has a subscribeToPayer function', () => {
        expect(() => assertIsClientWithSubscribeToPayer({ subscribeToPayer: subscribe })).not.toThrow();
    });
    it('throws when the client has no subscribeToPayer function', () => {
        expect(() => assertIsClientWithSubscribeToPayer({})).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
                capabilities: ['subscribeToPayer'],
            }),
        );
    });
});

describe('isClientWithSubscribeToIdentity', () => {
    it('returns true when the client has a subscribeToIdentity function', () => {
        expect(isClientWithSubscribeToIdentity({ subscribeToIdentity: subscribe })).toBe(true);
    });
    it('returns false when the client has no subscribeToIdentity function', () => {
        expect(isClientWithSubscribeToIdentity({})).toBe(false);
    });
    it('returns false when the client only has a subscribeToPayer function', () => {
        expect(isClientWithSubscribeToIdentity({ subscribeToPayer: subscribe })).toBe(false);
    });
});

describe('assertIsClientWithSubscribeToIdentity', () => {
    it('does not throw when the client has a subscribeToIdentity function', () => {
        expect(() => assertIsClientWithSubscribeToIdentity({ subscribeToIdentity: subscribe })).not.toThrow();
    });
    it('throws when the client has no subscribeToIdentity function', () => {
        expect(() => assertIsClientWithSubscribeToIdentity({})).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
                capabilities: ['subscribeToIdentity'],
            }),
        );
    });
});
