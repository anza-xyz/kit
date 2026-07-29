import { act } from '@testing-library/react';
import type { ReactNode } from 'react';

import { render } from '../../__test-utils__/render';

// Each built client is a fresh disposable; the mock records published ones so the test can assert
// disposal.
const mockPublishedClients: unknown[] = [];

// A chainable client stub: every `.use()` returns the same disposable object so the provider's
// `createClient().use(walletSigner(…)).use(solanaRpc(…))` chain resolves to one disposable client.
function makeDisposableClient() {
    const client: { [Symbol.dispose]: jest.Mock; use: () => typeof client } = {
        [Symbol.dispose]: jest.fn(),
        use: () => client,
    };
    return client;
}

jest.mock('@solana/kit', () => ({
    createClient: () => ({ use: () => makeDisposableClient() }),
    // `ClientProvider` derives RPC URLs via `chain.ts`, which brands them with these cluster helpers;
    // since this mock replaces the whole module, all three must be provided.
    devnet: (url: string) => url,
    // `buildClient` passes an `extendClient` plugin to `.use()`; the chainable stub above never
    // invokes plugins, so this only needs to exist for the import to resolve.
    extendClient: (client: unknown) => client,
    mainnet: (url: string) => url,
    testnet: (url: string) => url,
}));
jest.mock('@solana/kit-plugin-wallet', () => ({ walletSigner: () => ({}) }));
jest.mock('@solana/kit-plugin-rpc', () => ({ solanaRpc: () => ({}) }));
jest.mock('@solana/react', () => ({
    ClientProvider: ({ children, client }: { children: ReactNode; client: unknown }) => {
        mockPublishedClients.push(client);
        return children;
    },
}));

// Import after the mocks are registered.
import { ClientProvider } from '../ClientProvider';

function tree(chain: string) {
    return (
        <ClientProvider chain={chain as Parameters<typeof ClientProvider>[0]['chain']}>
            <div>child</div>
        </ClientProvider>
    );
}

describe('ClientProvider', () => {
    beforeEach(() => {
        mockPublishedClients.length = 0;
    });

    it('publishes a client immediately on mount without disposing it', () => {
        render(tree('solana:devnet'));
        const live = mockPublishedClients[mockPublishedClients.length - 1] as { [Symbol.dispose]: jest.Mock };
        expect(live).toBeDefined();
        expect(live[Symbol.dispose]).not.toHaveBeenCalled();
    });

    it('publishes a new client and disposes the previous one on a chain change', () => {
        const { rerender } = render(tree('solana:devnet'));
        const beforeSwitch = mockPublishedClients[mockPublishedClients.length - 1] as { [Symbol.dispose]: jest.Mock };
        act(() => {
            rerender(tree('solana:testnet'));
        });
        const afterSwitch = mockPublishedClients[mockPublishedClients.length - 1] as { [Symbol.dispose]: jest.Mock };
        expect(afterSwitch).not.toBe(beforeSwitch); // a new client was published immediately
        expect(beforeSwitch[Symbol.dispose]).toHaveBeenCalled(); // the old one was disposed
        expect(afterSwitch[Symbol.dispose]).not.toHaveBeenCalled(); // the live one is not disposed
    });

    it('disposes the published client on unmount', () => {
        const { unmount } = render(tree('solana:devnet'));
        const live = mockPublishedClients[mockPublishedClients.length - 1] as { [Symbol.dispose]: jest.Mock };
        unmount();
        expect(live[Symbol.dispose]).toHaveBeenCalled();
    });
});
