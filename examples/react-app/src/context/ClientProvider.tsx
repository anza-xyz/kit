import { createClient, extendClient } from '@solana/kit';
import { solanaDevnetRpc, solanaMainnetRpc, solanaTestnetRpc } from '@solana/kit-plugin-rpc';
import { walletSigner } from '@solana/kit-plugin-wallet';
import { ClientProvider as KitClientProvider } from '@solana/react';
import type { SolanaChain } from '@solana/wallet-standard-chains';
import { systemProgram } from '@solana-program/system';
import { useLayoutEffect, useState } from 'react';

type Props = Readonly<{
    chain: SolanaChain;
    children: React.ReactNode;
}>;

function buildClient(chain: SolanaChain) {
    const base = createClient().use(walletSigner({ chain }));
    // Stamp the target `chain` onto the client so consumers can read it back off `useClient()` *in
    // lockstep with* `rpc`/`rpcSubscriptions`, then install the system program. This is load-bearing,
    // not decorative: on a chain switch the selected chain (this component's `chain` prop) flips one
    // render before the rebuilt client is published, so anything that must move with the client's rpc —
    // most importantly `Balance`'s SWR cache key — has to derive `chain` from the client, or it would
    // key the new network's fetch against the old network's rpc.
    //
    // The RPC plugin is selected per chain, because each cluster's plugin brands its endpoint to that
    // cluster and installs the capabilities that cluster actually has: `solanaDevnetRpc` and
    // `solanaTestnetRpc` both bundle `airdrop` (and default to the public devnet/testnet endpoints),
    // while `solanaMainnetRpc` does not, since mainnet has no faucet. Each branch returns its
    // fully-built client, so `AppClient` stays a union whose mainnet member has no `airdrop` — which is
    // what lets `AirdropButton` narrow with `'airdrop' in client`.
    switch (chain) {
        case 'solana:mainnet':
            return base
                .use(
                    solanaMainnetRpc({
                        rpcUrl: process.env.REACT_EXAMPLE_APP_MAINNET_URL ?? 'https://api.mainnet-beta.solana.com',
                    }),
                )
                .use(client => extendClient(client, { chain }))
                .use(systemProgram());
        case 'solana:testnet':
            return base
                .use(solanaTestnetRpc())
                .use(client => extendClient(client, { chain }))
                .use(systemProgram());
        case 'solana:devnet':
        default:
            return base
                .use(solanaDevnetRpc())
                .use(client => extendClient(client, { chain }))
                .use(systemProgram());
    }
}

/**
 * The concrete Kit client type published by {@link ClientProvider} — a base client with the wallet
 * and RPC plugins installed, plus the active `chain` via {@link extendClient}. Pass it as the type
 * argument to `useClient` wherever this app reads the client from context (e.g.
 * `useClient<AppClient>()`) so every installed plugin's namespace (the wallet signer, `rpc`,
 * `rpcSubscriptions`, …) and the `chain` are typed.
 */
export type AppClient = ReturnType<typeof buildClient>;

/**
 * Builds a Kit client with the wallet and RPC plugins installed and publishes it via
 * `@solana/react`'s `ClientProvider`, rebuilding whenever the selected `chain` changes.
 *
 * Each wallet plugin is bound to a single chain — and each chain has its own RPC endpoints — so
 * switching chains builds a fresh client. The previous client is disposed by this effect's cleanup,
 * which also disposes the dev double-build under StrictMode.
 */
export function ClientProvider({ chain, children }: Props) {
    const [client, setClient] = useState<AppClient | null>(null);
    useLayoutEffect(() => {
        const next = buildClient(chain);
        // Publishing `next` synchronously here (rather than deriving it from state) is deliberate:
        // it lets the client be built/disposed alongside the external resource it wraps, with the
        // effect cleanup owning disposal.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setClient(next);
        return () => next[Symbol.dispose]();
    }, [chain]);
    if (!client) {
        // Only the pre-layout-effect render pass lands here; it is never painted.
        return null;
    }
    return <KitClientProvider client={client}>{children}</KitClientProvider>;
}
