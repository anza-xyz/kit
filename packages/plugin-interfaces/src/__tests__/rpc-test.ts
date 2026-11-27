import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';

import {
    assertIsClientWithRpc,
    assertIsClientWithRpcSubscriptions,
    isClientWithRpc,
    isClientWithRpcSubscriptions,
} from '../rpc';

describe('isClientWithRpc', () => {
    it('returns true when the client has an rpc', () => {
        expect(isClientWithRpc({ rpc: {} })).toBe(true);
    });
    it('returns false when the client has no rpc', () => {
        expect(isClientWithRpc({})).toBe(false);
    });
    it('returns false when the client only has rpc subscriptions', () => {
        expect(isClientWithRpc({ rpcSubscriptions: {} })).toBe(false);
    });
});

describe('assertIsClientWithRpc', () => {
    it('does not throw when the client has an rpc', () => {
        expect(() => assertIsClientWithRpc({ rpc: {} })).not.toThrow();
    });
    it('throws when the client has no rpc', () => {
        expect(() => assertIsClientWithRpc({})).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, { capabilities: ['rpc'] }),
        );
    });
});

describe('isClientWithRpcSubscriptions', () => {
    it('returns true when the client has rpc subscriptions', () => {
        expect(isClientWithRpcSubscriptions({ rpcSubscriptions: {} })).toBe(true);
    });
    it('returns false when the client has no rpc subscriptions', () => {
        expect(isClientWithRpcSubscriptions({})).toBe(false);
    });
    it('returns false when the client only has an rpc', () => {
        expect(isClientWithRpcSubscriptions({ rpc: {} })).toBe(false);
    });
});

describe('assertIsClientWithRpcSubscriptions', () => {
    it('does not throw when the client has rpc subscriptions', () => {
        expect(() => assertIsClientWithRpcSubscriptions({ rpcSubscriptions: {} })).not.toThrow();
    });
    it('throws when the client has no rpc subscriptions', () => {
        expect(() => assertIsClientWithRpcSubscriptions({})).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
                capabilities: ['rpcSubscriptions'],
            }),
        );
    });
});
