/* eslint-disable react-hooks/refs */
import { useIsWalletReady } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';
import { useRef } from 'react';

import type { AppClient } from '../context/WalletClientProvider';

/**
 * Whether the wallet has settled its initial auto-reconnect *at least once since this component
 * mounted*.
 *
 * Latches `true` on the first ready and never reverts, so a first-load placeholder can show during
 * the initial warm-up while later chain-switch warm-ups (handled by {@link useDisplayedWallet}'s
 * dimming) never re-trigger it. Kept separate from `useDisplayedWallet` on purpose: this is a
 * session-level latch with a different lifetime, and keeping it out lets `useDisplayedWallet` map
 * cleanly onto a future plugin `reconnectingTo` primitive.
 *
 * @returns `false` until the wallet first becomes ready, then permanently `true`.
 */
export function useHasWalletSettled(): boolean {
    const isReady = useIsWalletReady(useClient<AppClient>());
    const hasSettled = useRef(false);
    if (isReady) {
        hasSettled.current = true;
    }
    return hasSettled.current;
}
