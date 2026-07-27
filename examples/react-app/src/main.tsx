import './index.css';
import '@radix-ui/themes/styles.css';

import { Flex, Theme } from '@radix-ui/themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { GatedRoot } from './components/GatedRoot.tsx';
import { Nav } from './components/Nav.tsx';
import { ChainContextProvider } from './context/ChainContextProvider.tsx';
import { RpcContextProvider } from './context/RpcContextProvider.tsx';
import { WalletClientProvider } from './context/WalletClientProvider.tsx';

const rootNode = document.getElementById('root')!;
const root = createRoot(rootNode);
root.render(
    <StrictMode>
        <Theme>
            <ChainContextProvider>
                <RpcContextProvider>
                    <WalletClientProvider>
                        <Flex direction="column">
                            <Nav />
                            <GatedRoot />
                        </Flex>
                    </WalletClientProvider>
                </RpcContextProvider>
            </ChainContextProvider>
        </Theme>
    </StrictMode>,
);
