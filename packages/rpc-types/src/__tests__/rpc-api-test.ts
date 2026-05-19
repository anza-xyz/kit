import { isSolanaRpcResponse, type SolanaRpcResponse } from '../rpc-api';
import type { Slot } from '../typed-numbers';

describe('isSolanaRpcResponse', () => {
    it('returns true for a well-formed envelope', () => {
        const envelope: SolanaRpcResponse<{ lamports: bigint }> = {
            context: { slot: 99n as Slot },
            value: { lamports: 5n },
        };
        expect(isSolanaRpcResponse(envelope)).toBe(true);
    });

    it('accepts envelopes whose value is `undefined` or `null`', () => {
        expect(isSolanaRpcResponse({ context: { slot: 7n }, value: undefined })).toBe(true);
        expect(isSolanaRpcResponse({ context: { slot: 8n }, value: null })).toBe(true);
    });

    it('ignores extra fields on `context` (future-proof against new envelope fields)', () => {
        expect(isSolanaRpcResponse({ context: { apiVersion: '2.0', slot: 1n }, value: 42 })).toBe(true);
    });

    it('returns false for raw notifications without an envelope', () => {
        expect(isSolanaRpcResponse({ parent: 9n, root: 8n, slot: 10n })).toBe(false);
    });

    it('returns false for primitives', () => {
        expect(isSolanaRpcResponse(42)).toBe(false);
        expect(isSolanaRpcResponse('hello')).toBe(false);
        expect(isSolanaRpcResponse(true)).toBe(false);
    });

    it('returns false for nullish input', () => {
        expect(isSolanaRpcResponse(undefined)).toBe(false);
        expect(isSolanaRpcResponse(null)).toBe(false);
    });

    it('returns false when `value` is missing', () => {
        expect(isSolanaRpcResponse({ context: { slot: 1n } })).toBe(false);
    });

    it('returns false when `context` is missing', () => {
        expect(isSolanaRpcResponse({ value: 42 })).toBe(false);
    });

    it('returns false when `context` is not an object', () => {
        expect(isSolanaRpcResponse({ context: 'oops', value: 42 })).toBe(false);
        expect(isSolanaRpcResponse({ context: null, value: 42 })).toBe(false);
    });

    it('returns false when `context.slot` is missing', () => {
        expect(isSolanaRpcResponse({ context: { apiVersion: '2.0' }, value: 42 })).toBe(false);
    });

    it('returns false when `context.slot` is not a bigint', () => {
        expect(isSolanaRpcResponse({ context: { slot: 1 }, value: 42 })).toBe(false);
        expect(isSolanaRpcResponse({ context: { slot: '1' }, value: 42 })).toBe(false);
        expect(isSolanaRpcResponse({ context: { slot: null }, value: 42 })).toBe(false);
    });
});
