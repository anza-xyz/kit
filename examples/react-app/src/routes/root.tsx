import { Box, Code, Container, DataList, Flex, Heading, Spinner, Text } from '@radix-ui/themes';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import type { SolanaChain } from '@solana/wallet-standard-chains';
import { getUiWalletAccountStorageKey } from '@wallet-standard/ui';
import { Suspense, useContext } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Balance } from '../components/Balance';
import { FeatureNotSupportedCallout } from '../components/FeatureNotSupportedCallout';
import { FeaturePanel } from '../components/FeaturePanel';
import { SlotIndicator } from '../components/SlotIndicator';
import { SolanaPartialSignTransactionFeaturePanel } from '../components/SolanaPartialSignTransactionFeaturePanel';
import { SolanaSignAndSendTransactionFeaturePanel } from '../components/SolanaSignAndSendTransactionFeaturePanel';
import { SolanaSignMessageFeaturePanel } from '../components/SolanaSignMessageFeaturePanel';
import { SolanaSignTransactionFeaturePanel } from '../components/SolanaSignTransactionFeaturePanel';
import { WalletAccountIcon } from '../components/WalletAccountIcon';
import { ChainContext } from '../context/ChainContext';

function SlotIndicatorPanel({ chain }: { chain: SolanaChain }) {
    return (
        <Flex direction="column" align="end">
            <Heading as="h4" size="3">
                Slot
            </Heading>
            <ErrorBoundary fallback={<Text>&ndash;</Text>} key={chain}>
                <SlotIndicator />
            </ErrorBoundary>
        </Flex>
    );
}

/**
 * The wallet-dependent view, gated by `WalletReadyGate`.
 */
function Root() {
    const { chain } = useContext(ChainContext);
    const connected = useConnectedWallet();
    const errorBoundaryResetKeys = [chain, connected && getUiWalletAccountStorageKey(connected.account)].filter(
        Boolean,
    );
    if (!connected) {
        return (
            <Container mx={{ initial: '3', xs: '6' }}>
                <Flex gap="6" direction="column">
                    <Flex justify="end">
                        <SlotIndicatorPanel chain={chain} />
                    </Flex>
                    <Text as="p">Click &ldquo;Connect Wallet&rdquo; to get started.</Text>
                </Flex>
            </Container>
        );
    }
    return (
        <Container mx={{ initial: '3', xs: '6' }}>
            <Flex gap="6" direction="column">
                <Flex gap="2">
                    <Flex align="center" gap="3" flexGrow="1">
                        <WalletAccountIcon account={connected.account} height="48" width="48" />
                        <Box>
                            <Heading as="h4" size="3">
                                {connected.account.label ?? 'Unlabeled Account'}
                            </Heading>
                            <Code variant="outline" truncate size={{ initial: '1', xs: '2' }}>
                                {connected.account.address}
                            </Code>
                        </Box>
                    </Flex>
                    <Flex gap="6" align="end">
                        <SlotIndicatorPanel chain={chain} />
                        <Flex direction="column" align="end">
                            <Heading as="h4" size="3">
                                Balance
                            </Heading>
                            <ErrorBoundary
                                fallback={<Text>&ndash;</Text>}
                                key={`${connected.account.address}:${chain}`}
                            >
                                <Suspense fallback={<Spinner loading my="1" />}>
                                    <Balance account={connected.account} />
                                </Suspense>
                            </ErrorBoundary>
                        </Flex>
                    </Flex>
                </Flex>
                <DataList.Root orientation={{ initial: 'vertical', sm: 'horizontal' }} size="3">
                    <FeaturePanel label="Sign Message">
                        <ErrorBoundary
                            FallbackComponent={FeatureNotSupportedCallout}
                            resetKeys={errorBoundaryResetKeys}
                        >
                            <SolanaSignMessageFeaturePanel account={connected.account} />
                        </ErrorBoundary>
                    </FeaturePanel>
                    <FeaturePanel label="Sign And Send Transaction">
                        <ErrorBoundary
                            FallbackComponent={FeatureNotSupportedCallout}
                            resetKeys={errorBoundaryResetKeys}
                        >
                            <SolanaSignAndSendTransactionFeaturePanel signer={connected.signer} />
                        </ErrorBoundary>
                    </FeaturePanel>
                    <FeaturePanel label="Sign Transaction">
                        <ErrorBoundary
                            FallbackComponent={FeatureNotSupportedCallout}
                            resetKeys={errorBoundaryResetKeys}
                        >
                            <SolanaSignTransactionFeaturePanel signer={connected.signer} />
                        </ErrorBoundary>
                    </FeaturePanel>
                    <FeaturePanel label="Partial Sign Transaction">
                        <ErrorBoundary
                            FallbackComponent={FeatureNotSupportedCallout}
                            resetKeys={errorBoundaryResetKeys}
                        >
                            <SolanaPartialSignTransactionFeaturePanel signer={connected.signer} />
                        </ErrorBoundary>
                    </FeaturePanel>
                </DataList.Root>
            </Flex>
        </Container>
    );
}

export default Root;
