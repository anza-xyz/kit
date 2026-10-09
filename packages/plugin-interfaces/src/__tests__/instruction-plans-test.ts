import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';

import {
    assertIsClientWithTransactionPlanning,
    assertIsClientWithTransactionSending,
    assertIsClientWithTransactionSigning,
    isClientWithTransactionPlanning,
    isClientWithTransactionSending,
    isClientWithTransactionSigning,
} from '../instruction-plans';

const notImplemented = jest.fn().mockRejectedValue(new Error('not implemented'));

describe('isClientWithTransactionPlanning', () => {
    it('returns true when the client has both planning functions', () => {
        expect(
            isClientWithTransactionPlanning({ planTransaction: notImplemented, planTransactions: notImplemented }),
        ).toBe(true);
    });
    it('returns false when the client only has a planTransaction function', () => {
        expect(isClientWithTransactionPlanning({ planTransaction: notImplemented })).toBe(false);
    });
    it('returns false when the client only has a planTransactions function', () => {
        expect(isClientWithTransactionPlanning({ planTransactions: notImplemented })).toBe(false);
    });
});

describe('assertIsClientWithTransactionPlanning', () => {
    it('does not throw when the client has both planning functions', () => {
        expect(() =>
            assertIsClientWithTransactionPlanning({
                planTransaction: notImplemented,
                planTransactions: notImplemented,
            }),
        ).not.toThrow();
    });
    it('throws when the client is missing a planning function', () => {
        expect(() => assertIsClientWithTransactionPlanning({ planTransaction: notImplemented })).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
                capabilities: ['planTransaction', 'planTransactions'],
            }),
        );
    });
});

describe('isClientWithTransactionSending', () => {
    it('returns true when the client has both sending functions', () => {
        expect(
            isClientWithTransactionSending({ sendTransaction: notImplemented, sendTransactions: notImplemented }),
        ).toBe(true);
    });
    it('returns false when the client only has a sendTransaction function', () => {
        expect(isClientWithTransactionSending({ sendTransaction: notImplemented })).toBe(false);
    });
    it('returns false when the client only has a sendTransactions function', () => {
        expect(isClientWithTransactionSending({ sendTransactions: notImplemented })).toBe(false);
    });
});

describe('assertIsClientWithTransactionSending', () => {
    it('does not throw when the client has both sending functions', () => {
        expect(() =>
            assertIsClientWithTransactionSending({ sendTransaction: notImplemented, sendTransactions: notImplemented }),
        ).not.toThrow();
    });
    it('throws when the client is missing a sending function', () => {
        expect(() => assertIsClientWithTransactionSending({ sendTransactions: notImplemented })).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
                capabilities: ['sendTransaction', 'sendTransactions'],
            }),
        );
    });
});

describe('isClientWithTransactionSigning', () => {
    it('returns true when the client has both signing functions', () => {
        expect(
            isClientWithTransactionSigning({ signTransaction: notImplemented, signTransactions: notImplemented }),
        ).toBe(true);
    });
    it('returns false when the client only has a signTransaction function', () => {
        expect(isClientWithTransactionSigning({ signTransaction: notImplemented })).toBe(false);
    });
    it('returns false when the client only has sending functions', () => {
        expect(
            isClientWithTransactionSigning({ sendTransaction: notImplemented, sendTransactions: notImplemented }),
        ).toBe(false);
    });
});

describe('assertIsClientWithTransactionSigning', () => {
    it('does not throw when the client has both signing functions', () => {
        expect(() =>
            assertIsClientWithTransactionSigning({ signTransaction: notImplemented, signTransactions: notImplemented }),
        ).not.toThrow();
    });
    it('throws when the client is missing a signing function', () => {
        expect(() => assertIsClientWithTransactionSigning({ signTransaction: notImplemented })).toThrow(
            new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
                capabilities: ['signTransaction', 'signTransactions'],
            }),
        );
    });
});
