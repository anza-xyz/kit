import { Flex } from '@radix-ui/themes';

import { usePersistedChain } from './chain.ts';
import { GatedRoot } from './components/GatedRoot.tsx';
import { Nav } from './components/Nav.tsx';
import { ClientProvider } from './context/ClientProvider.tsx';

export function App() {
    // The *selected* chain lives here, at the top of the tree. It is handed to `ClientProvider`,
    // which rebuilds the client for that chain, and its setter to `Nav`'s chain picker. Everything
    // else reads the *active* chain back off the client (`useClient().chain`).
    const [chain, setChain] = usePersistedChain();
    return (
        <ClientProvider chain={chain}>
            <Flex direction="column">
                <Nav onChainChange={setChain} />
                <GatedRoot />
            </Flex>
        </ClientProvider>
    );
}
