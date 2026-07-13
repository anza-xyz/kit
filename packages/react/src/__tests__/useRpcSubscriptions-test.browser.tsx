import {
    type ClientWithRpcSubscriptions,
    createClient,
    isSolanaError,
    type RpcSubscriptions,
    SOLANA_ERROR__REACT__MISSING_CAPABILITY,
    SOLANA_ERROR__REACT__MISSING_PROVIDER,
    type SolanaRpcSubscriptionsApi,
} from '@solana/kit';

import { createClientWrapper } from '../__test-utils__/client-wrapper';
import { renderHook } from '../__test-utils__/render';
import { useRpcSubscriptions } from '../useRpcSubscriptions';

describe('useRpcSubscriptions', () => {
    it('returns the client rpcSubscriptions object when the capability is present', () => {
        const rpcSubscriptions = {
            accountNotifications: () => {},
        } as unknown as RpcSubscriptions<SolanaRpcSubscriptionsApi>;
        const client = createClient<ClientWithRpcSubscriptions<SolanaRpcSubscriptionsApi>>({ rpcSubscriptions });
        const { result } = renderHook(() => useRpcSubscriptions(), { wrapper: createClientWrapper(client) });
        expect(result.current).toBe(rpcSubscriptions);
    });

    it('throws MISSING_CAPABILITY with hookName useRpcSubscriptions when rpcSubscriptions is absent', () => {
        const client = createClient(); // no `rpcSubscriptions` capability
        const { result } = renderHook(
            () => {
                try {
                    return useRpcSubscriptions();
                } catch (err) {
                    return err;
                }
            },
            { wrapper: createClientWrapper(client) },
        );
        expect(isSolanaError(result.current, SOLANA_ERROR__REACT__MISSING_CAPABILITY)).toBe(true);
        const ctx = (result.current as { context: { capabilities: readonly string[]; hookName: string } }).context;
        expect(ctx.capabilities).toEqual(['rpcSubscriptions']);
        expect(ctx.hookName).toBe('useRpcSubscriptions');
    });

    it('throws MISSING_PROVIDER when rendered with no ClientProvider', () => {
        const { result } = renderHook(() => {
            try {
                return useRpcSubscriptions();
            } catch (err) {
                return err;
            }
        });
        expect(isSolanaError(result.current, SOLANA_ERROR__REACT__MISSING_PROVIDER)).toBe(true);
    });
});
