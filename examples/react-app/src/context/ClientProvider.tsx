import type { ClusterUrl } from '@solana/kit';
import { createClient, extendClient } from '@solana/kit';
import { solanaRpc } from '@solana/kit-plugin-rpc';
import { walletSigner } from '@solana/kit-plugin-wallet';
import { ClientProvider as KitClientProvider } from '@solana/react';
import type { SolanaChain } from '@solana/wallet-standard-chains';
import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ChainContext } from './ChainContext';

type Props = Readonly<{
    children: React.ReactNode;
}>;

function buildClient(chain: SolanaChain, rpcUrl: ClusterUrl, rpcSubscriptionsUrl: ClusterUrl) {
    return (
        createClient()
            .use(walletSigner({ chain }))
            .use(solanaRpc({ rpcSubscriptionsUrl, rpcUrl }))
            // Include the chain on the client so consumers can read it back off `useClient()` in lockstep
            // with `rpc`/`rpcSubscriptions`.
            .use(client => extendClient(client, { chain }))
    );
}

/**
 * The concrete Kit client type published by {@link ClientProvider} — a base client with the wallet
 * and RPC plugins installed, plus the target `chain` via {@link extendClient}. Pass it as
 * the type argument to `useClient` wherever this app reads the client from context (e.g.
 * `useClient<AppClient>()`) so every installed plugin's namespace (the wallet signer, `rpc`,
 * `rpcSubscriptions`, …) and the `chain` are typed.
 */
export type AppClient = ReturnType<typeof buildClient>;

/**
 * Builds a Kit client with the wallet and RPC plugins installed and publishes it via `@solana/react`'s
 * `ClientProvider`, rebuilding it whenever the selected chain changes.
 *
 * Each wallet plugin is bound to a single chain — and each chain has its own RPC endpoints — so
 * switching chains means building a fresh client. A freshly built client runs a silent
 * auto-reconnect that briefly passes through `'pending'` / `'reconnecting'`. Rather than hide the
 * whole app during that warm-up, we publish the client right away and let {@link WalletReadyGate}
 * hold back only the wallet-dependent UI — so the app chrome (title, chain switcher) stays on screen
 * throughout.
 *
 * The first client is published from a layout effect — before the browser paints — so the app
 * chrome is visible from the very first frame. On a later chain switch, the current (already-ready)
 * client is kept on screen until the new one has settled via `whenReady()`, so the swap moves
 * straight from the old connection to the new one without flashing a reconnecting state.
 *
 * Client disposal (tearing down wallet-standard registry listeners) is split by who last owns the
 * client: a published client is disposed when a successor replaces it (or the provider unmounts),
 * while a client superseded *before* it was published is disposed by its own effect's cleanup. The
 * latter must not live in the `whenReady()` continuation: a client stuck mid-warm-up never settles
 * `whenReady` on its own — it is the *disposal* that settles it. Which is also why the `cancelled`
 * guard in the continuation is load-bearing: once the cleanup disposes a superseded client, its
 * `whenReady()` resolves and the continuation runs — the guard is what keeps the disposed client
 * from being published.
 */
export function ClientProvider({ children }: Props) {
    const { chain, solanaRpcSubscriptionsUrl, solanaRpcUrl } = useContext(ChainContext);
    const [client, setClient] = useState<AppClient | null>(null);
    // The client currently published to the tree, tracked outside React state so the effects
    // below can dispose hand-over-hand without extra renders.
    const activeClientRef = useRef<AppClient | null>(null);

    useLayoutEffect(() => {
        const next = buildClient(chain, solanaRpcUrl, solanaRpcSubscriptionsUrl);
        let cancelled = false;
        const publish = () => {
            activeClientRef.current?.[Symbol.dispose]();
            activeClientRef.current = next;
            setClient(next);
        };
        if (activeClientRef.current === null) {
            // First client: publish before paint. WalletReadyGate keeps the wallet-dependent
            // parts hidden until this client's warm-up settles.
            publish();
        } else {
            // Chain switch: keep showing the current, already-ready client until the new one has
            // finished warming up, then swap (disposing the one it replaces). `whenReady()` also
            // settles when `next` is disposed by the cleanup below, so this continuation always
            // runs eventually — `cancelled` keeps a disposed client from being published.
            void next.wallet.whenReady().then(() => {
                if (!cancelled) {
                    publish();
                }
            });
        }
        return () => {
            cancelled = true;
            if (activeClientRef.current !== next) {
                // Superseded before it was published; nothing else owns it, so dispose it here.
                next[Symbol.dispose]();
            }
        };
    }, [chain, solanaRpcSubscriptionsUrl, solanaRpcUrl]);

    // Dispose the published client when the provider unmounts. (StrictMode's simulated unmount
    // trips this once at mount in dev, disposing the first client early — the effect above then
    // re-runs with an empty activeClientRef and publishes a fresh client immediately.)
    useEffect(
        () => () => {
            activeClientRef.current?.[Symbol.dispose]();
            activeClientRef.current = null;
        },
        [],
    );

    if (!client) {
        // Only the pre-layout-effect render pass lands here; it is never painted.
        return null;
    }
    return <KitClientProvider client={client}>{children}</KitClientProvider>;
}
