import { act } from '@testing-library/react';
import type { ReactNode } from 'react';

import { render } from '../../__test-utils__/render';
import { ChainContext, DEFAULT_CHAIN_CONFIG } from '../ChainContext';

// Each built client is a fresh disposable; the mock records published ones so the test can assert
// disposal.
const mockPublishedClients: unknown[] = [];

jest.mock('@solana/kit', () => ({
    createClient: () => ({
        use: () => ({ [Symbol.dispose]: jest.fn() }),
    }),
    // `ChainContext` (imported below for its `DEFAULT_CHAIN_CONFIG`) also pulls `devnet` from
    // `@solana/kit`; since this mock replaces the whole module, `devnet` must be provided too.
    devnet: (url: string) => url,
}));
jest.mock('@solana/kit-plugin-wallet', () => ({ walletSigner: () => ({}) }));
jest.mock('@solana/react', () => ({
    ClientProvider: ({ children, client }: { children: ReactNode; client: unknown }) => {
        mockPublishedClients.push(client);
        return children;
    },
}));

// Import after the mocks are registered.
import { WalletClientProvider } from '../WalletClientProvider';

function tree(chain: string) {
    return (
        <ChainContext.Provider value={{ ...DEFAULT_CHAIN_CONFIG, chain: chain as typeof DEFAULT_CHAIN_CONFIG.chain }}>
            <WalletClientProvider>
                <div>child</div>
            </WalletClientProvider>
        </ChainContext.Provider>
    );
}

describe('WalletClientProvider', () => {
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
