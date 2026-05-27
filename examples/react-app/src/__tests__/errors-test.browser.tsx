import { SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,SolanaError } from '@solana/kit';
import {
    WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
    WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_FEATURE_UNIMPLEMENTED,
    WALLET_STANDARD_ERROR__FEATURES__WALLET_FEATURE_UNIMPLEMENTED,
    WalletStandardError,
} from '@wallet-standard/core';
import React from 'react';

import { render } from '../__test-utils__/render';
import { getErrorMessage } from '../errors';

describe('getErrorMessage', () => {
    function renderInDocument(node: React.ReactNode): string {
        const { container } = render(<div>{node}</div>);
        return container.textContent ?? '';
    }

    it('extracts `err.message` from a plain error-like object', () => {
        expect(getErrorMessage({ message: 'bang' }, 'fallback')).toBe('bang');
    });

    it('coerces non-string `err.message` to a string', () => {
        expect(getErrorMessage({ message: 42 }, 'fallback')).toBe('42');
    });

    it('returns the fallback for primitives or objects with no `message`', () => {
        expect(getErrorMessage('plain string', 'fallback')).toBe('fallback');
        expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
        expect(getErrorMessage(null, 'fallback')).toBe('fallback');
        expect(getErrorMessage({}, 'fallback')).toBe('fallback');
    });

    it('renders the unsupported feature name for WALLET_ACCOUNT_FEATURE_UNIMPLEMENTED', () => {
        const err = new WalletStandardError(WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_FEATURE_UNIMPLEMENTED, {
            address: 'addr',
            featureName: 'solana:signMessage',
            supportedChains: ['solana:devnet'],
            supportedFeatures: [],
        });
        const text = renderInDocument(getErrorMessage(err, 'fallback'));
        expect(text).toContain('solana:signMessage');
    });

    it('lists chains and features for WALLET_FEATURE_UNIMPLEMENTED', () => {
        const err = new WalletStandardError(WALLET_STANDARD_ERROR__FEATURES__WALLET_FEATURE_UNIMPLEMENTED, {
            featureName: 'solana:signMessage',
            supportedChains: ['solana:devnet', 'solana:mainnet'],
            supportedFeatures: ['solana:signTransaction'],
            walletName: 'TestWallet',
        });
        const text = renderInDocument(getErrorMessage(err, 'fallback'));
        expect(text).toContain('TestWallet');
        expect(text).toContain('solana:devnet');
        expect(text).toContain('solana:mainnet');
        expect(text).toContain('solana:signMessage');
        expect(text).toContain('solana:signTransaction');
    });

    it('lists supported chains for WALLET_ACCOUNT_CHAIN_UNSUPPORTED', () => {
        const err = new WalletStandardError(WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED, {
            address: 'addr',
            chain: 'solana:mainnet',
            featureName: 'solana:signMessage',
            supportedChains: ['solana:devnet'],
            supportedFeatures: [],
        });
        const text = renderInDocument(getErrorMessage(err, 'fallback'));
        expect(text).toContain('solana:mainnet');
        expect(text).toContain('solana:devnet');
    });

    it('renders preflight logs for the JSON-RPC preflight-failure error', () => {
        // The full preflight context is large; cast through `unknown` since `getErrorMessage`
        // only reads `err.message` and `err.context.logs`.
        const err = new SolanaError(SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE, {
            logs: ['Program log: hello', 'Program log: world'],
        } as unknown as ConstructorParameters<typeof SolanaError>[1]);
        const text = renderInDocument(getErrorMessage(err, 'fallback'));
        expect(text).toContain('Program log: hello');
        expect(text).toContain('Program log: world');
    });
});
