import { createClient } from '@solana/kit';
import { walletSigner } from '@solana/kit-plugin-wallet';
import { ClientProvider } from '@solana/react';
import type { SolanaChain } from '@solana/wallet-standard-chains';
import { useContext, useLayoutEffect, useState } from 'react';

import { ChainContext } from './ChainContext';

type Props = Readonly<{
    children: React.ReactNode;
}>;

function buildWalletClient(chain: SolanaChain) {
    return createClient().use(walletSigner({ chain }));
}

/**
 * The concrete Kit client type published by {@link WalletClientProvider} — a base client with the
 * wallet plugin installed. Pass it as the type argument to `useClient` wherever this app reads the
 * client from context (e.g. `useClient<AppClient>()`) so the wallet plugin's namespace is typed.
 */
export type AppClient = ReturnType<typeof buildWalletClient>;

/**
 * Builds a Kit client with the wallet plugin installed and publishes it via `ClientProvider`,
 * rebuilding on chain change.
 *
 * Each wallet plugin is bound to a single chain, so switching chains builds a fresh client. 
 * The previous client is disposed by this effect's cleanup, which also disposes the dev 
 * double-build under StrictMode.
 */
export function WalletClientProvider({ children }: Props) {
    const { chain } = useContext(ChainContext);
    const [client, setClient] = useState<AppClient | null>(null);
    useLayoutEffect(() => {
        const next = buildWalletClient(chain);
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
    return <ClientProvider client={client}>{children}</ClientProvider>;
}
