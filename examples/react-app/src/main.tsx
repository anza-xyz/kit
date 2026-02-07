import './index.css';
import '@radix-ui/themes/styles.css';

import { Flex, Section, Theme } from '@radix-ui/themes';
import { SelectedWalletAccountContextProvider } from '@solana/react';
import type { UiWallet } from '@wallet-standard/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Nav } from './components/Nav.tsx';
import { ChainContextProvider } from './context/ChainContextProvider.tsx';
import { RpcContextProvider } from './context/RpcContextProvider.tsx';
import Root from './routes/root.tsx';

const STORAGE_KEY = 'solana-wallet-standard-example-react:selected-wallet-and-address';
const stateSync = {
    deleteSelectedWallet: () => localStorage.removeItem(STORAGE_KEY),
    getSelectedWallet: () => localStorage.getItem(STORAGE_KEY),
    storeSelectedWallet: (accountKey: string) => localStorage.setItem(STORAGE_KEY, accountKey),
};

const rootNode = document.getElementById('root')!;
const root = createRoot(rootNode);
root.render(
    <StrictMode>
        <Theme>
            <ChainContextProvider>
                <SelectedWalletAccountContextProvider
                    filterWallets={(_: UiWallet) => true}
                    stateSync={stateSync}
                >
                    <RpcContextProvider>
                        <Flex direction="column">
                            <Nav />
                            <Section>
                                <Root />
                            </Section>
                        </Flex>
                    </RpcContextProvider>
                </SelectedWalletAccountContextProvider>
            </ChainContextProvider>
        </Theme>
    </StrictMode>,
);
