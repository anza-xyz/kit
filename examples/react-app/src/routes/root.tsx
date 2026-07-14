import { Box, Code, DataList, Flex, Heading, Spinner, Text } from '@radix-ui/themes';
import { useClient } from '@solana/react';
import { getUiWalletAccountStorageKey } from '@wallet-standard/ui';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Balance } from '../components/Balance';
import { Dimmable } from '../components/Dimmable';
import { FeatureNotSupportedCallout } from '../components/FeatureNotSupportedCallout';
import { FeaturePanel } from '../components/FeaturePanel';
import { SlotIndicatorPanel } from '../components/SlotIndicatorPanel';
import { SolanaPartialSignTransactionFeaturePanel } from '../components/SolanaPartialSignTransactionFeaturePanel';
import { SolanaSignAndSendTransactionFeaturePanel } from '../components/SolanaSignAndSendTransactionFeaturePanel';
import { SolanaSignMessageFeaturePanel } from '../components/SolanaSignMessageFeaturePanel';
import { SolanaSignTransactionFeaturePanel } from '../components/SolanaSignTransactionFeaturePanel';
import { WalletAccountIcon } from '../components/WalletAccountIcon';
import type { AppClient } from '../context/ClientProvider';
import { useDisplayedWallet } from '../hooks/useDisplayedWallet';

/**
 * The wallet-dependent view. Reads the *displayed* connection so it holds the previous account
 * through a chain-switch warm-up rather than flashing disconnected. The wallet-dependent cells
 * (account header, balance, feature panels) dim while `isStale`.
 */
function Root() {
    // Read `chain` off the client (the *active* network) rather than `ChainContext` (the eagerly
    // updated *selected* network) so the reset/remount keys below flip only when the client actually
    // swaps — in lockstep with the rpc/subscriptions those cells read — rather than a render early.
    const { chain } = useClient<AppClient>();
    const { connected, isStale } = useDisplayedWallet();
    const errorBoundaryResetKeys = [chain, connected && getUiWalletAccountStorageKey(connected.account)].filter(
        Boolean,
    );
    if (!connected) {
        return (
            <Flex gap="6" direction="column">
                <Flex justify="end">
                    <SlotIndicatorPanel chain={chain} />
                </Flex>
                <Dimmable busy={isStale}>
                    <Text as="p">Click &ldquo;Connect Wallet&rdquo; to get started.</Text>
                </Dimmable>
            </Flex>
        );
    }
    return (
        <Flex gap="6" direction="column">
            <Flex gap="2">
                <Box flexGrow="1">
                    <Dimmable busy={isStale}>
                        <Flex align="center" gap="3">
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
                    </Dimmable>
                </Box>
                <Flex gap="6" align="end">
                    <SlotIndicatorPanel chain={chain} />
                    <Dimmable busy={isStale}>
                        <Flex direction="column" align="end">
                            <Heading as="h4" size="3">
                                Balance
                            </Heading>
                            <ErrorBoundary fallback={<Text>&ndash;</Text>} key={`${connected.account.address}:${chain}`}>
                                <Suspense fallback={<Spinner loading my="1" />}>
                                    <Balance account={connected.account} />
                                </Suspense>
                            </ErrorBoundary>
                        </Flex>
                    </Dimmable>
                </Flex>
            </Flex>
            <Dimmable busy={isStale}>
                <DataList.Root orientation={{ initial: 'vertical', sm: 'horizontal' }} size="3">
                    <FeaturePanel label="Sign Message">
                        <ErrorBoundary FallbackComponent={FeatureNotSupportedCallout} resetKeys={errorBoundaryResetKeys}>
                            <SolanaSignMessageFeaturePanel account={connected.account} />
                        </ErrorBoundary>
                    </FeaturePanel>
                    <FeaturePanel label="Sign And Send Transaction">
                        <ErrorBoundary FallbackComponent={FeatureNotSupportedCallout} resetKeys={errorBoundaryResetKeys}>
                            <SolanaSignAndSendTransactionFeaturePanel signer={connected.signer} />
                        </ErrorBoundary>
                    </FeaturePanel>
                    <FeaturePanel label="Sign Transaction">
                        <ErrorBoundary FallbackComponent={FeatureNotSupportedCallout} resetKeys={errorBoundaryResetKeys}>
                            <SolanaSignTransactionFeaturePanel signer={connected.signer} />
                        </ErrorBoundary>
                    </FeaturePanel>
                    <FeaturePanel label="Partial Sign Transaction">
                        <ErrorBoundary FallbackComponent={FeatureNotSupportedCallout} resetKeys={errorBoundaryResetKeys}>
                            <SolanaPartialSignTransactionFeaturePanel signer={connected.signer} />
                        </ErrorBoundary>
                    </FeaturePanel>
                </DataList.Root>
            </Dimmable>
        </Flex>
    );
}

export default Root;
