/* eslint-disable react-hooks/refs */
import { useConnectedWallet, useIsWalletReady } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';
import { useRef } from 'react';

import type { AppClient } from '../context/ClientProvider';

/**
 * The connection to *display*, held stable across the wallet's warm-up.
 *
 * A chain switch rebuilds the client, and the new client reports `useConnectedWallet` as `null`
 * while it silently reconnects. Rather than flash a disconnected state, this hook returns the last
 * *settled* connection (retained in a ref that survives the client instance being swapped) and flags
 * the window with `isStale`. Because the retained value belongs to the previous, now-disposed client,
 * callers must render it read-only and block interaction while `isStale` (e.g. `disabled`,
 * {@link Dimmable}).
 *
 * @returns `{ connected, isStale }` — `connected` is live when ready, otherwise the last settled
 * value; `isStale` is `true` during warm-up.
 *
 * @see {@link useHasWalletSettled} — the first-load latch, deliberately a separate hook.
 */
export function useDisplayedWallet() {
    const client = useClient<AppClient>();
    const connected = useConnectedWallet(client);
    const isReady = useIsWalletReady(client);
    const lastSettled = useRef(connected);
    if (isReady) {
        lastSettled.current = connected;
    }
    return { connected: isReady ? connected : lastSettled.current, isStale: !isReady };
}
