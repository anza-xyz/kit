import {
    type ClientWithRpc,
    createClient,
    isSolanaError,
    type Rpc,
    SOLANA_ERROR__REACT__MISSING_CAPABILITY,
    SOLANA_ERROR__REACT__MISSING_PROVIDER,
    type SolanaRpcApi,
} from '@solana/kit';

import { createClientWrapper } from '../__test-utils__/client-wrapper';
import { renderHook } from '../__test-utils__/render';
import { useRpc } from '../useRpc';

describe('useRpc', () => {
    it('returns the client rpc object when the capability is present', () => {
        const rpc = { getBalance: () => {} } as unknown as Rpc<SolanaRpcApi>;
        const client = createClient<ClientWithRpc<SolanaRpcApi>>({ rpc });
        const { result } = renderHook(() => useRpc(), { wrapper: createClientWrapper(client) });
        expect(result.current).toBe(rpc);
    });

    it('throws MISSING_CAPABILITY with hookName useRpc when rpc is absent', () => {
        const client = createClient(); // no `rpc` capability
        const { result } = renderHook(
            () => {
                try {
                    return useRpc();
                } catch (err) {
                    return err;
                }
            },
            { wrapper: createClientWrapper(client) },
        );
        expect(isSolanaError(result.current, SOLANA_ERROR__REACT__MISSING_CAPABILITY)).toBe(true);
        const ctx = (result.current as { context: { capabilities: readonly string[]; hookName: string } }).context;
        expect(ctx.capabilities).toEqual(['rpc']);
        expect(ctx.hookName).toBe('useRpc');
    });

    it('throws MISSING_PROVIDER when rendered with no ClientProvider', () => {
        const { result } = renderHook(() => {
            try {
                return useRpc();
            } catch (err) {
                return err;
            }
        });
        expect(isSolanaError(result.current, SOLANA_ERROR__REACT__MISSING_PROVIDER)).toBe(true);
    });
});
