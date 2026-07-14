import './index.css';
import '@radix-ui/themes/styles.css';

import { Flex, Theme } from '@radix-ui/themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { GatedRoot } from './components/GatedRoot.tsx';
import { Nav } from './components/Nav.tsx';
import { ChainContextProvider } from './context/ChainContextProvider.tsx';
import { ClientProvider } from './context/ClientProvider.tsx';

const rootNode = document.getElementById('root')!;
const root = createRoot(rootNode);
root.render(
    <StrictMode>
        <Theme>
            <ChainContextProvider>
                <ClientProvider>
                    <Flex direction="column">
                        <Nav />
                        <GatedRoot />
                    </Flex>
                </ClientProvider>
            </ChainContextProvider>
        </Theme>
    </StrictMode>,
);
