import './index.css';
import '@radix-ui/themes/styles.css';

import { Flex, Section, Spinner, Text, Theme } from '@radix-ui/themes';
import { WalletReadyGate } from '@solana/kit-plugin-wallet/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Nav } from './components/Nav.tsx';
import { ChainContextProvider } from './context/ChainContextProvider.tsx';
import { RpcContextProvider } from './context/RpcContextProvider.tsx';
import { WalletClientProvider } from './context/WalletClientProvider.tsx';
import Root from './routes/root.tsx';

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
                            <Section>
                                <WalletReadyGate
                                    fallback={
                                        <Flex align="center" justify="center" gap="2" p="9">
                                            <Spinner loading />
                                            <Text as="p">Connecting to your wallet&hellip;</Text>
                                        </Flex>
                                    }
                                >
                                    <Root />
                                </WalletReadyGate>
                            </Section>
                        </Flex>
                    </WalletClientProvider>
                </RpcContextProvider>
            </ChainContextProvider>
        </Theme>
    </StrictMode>,
);
