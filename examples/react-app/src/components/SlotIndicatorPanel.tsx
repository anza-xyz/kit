import { Flex, Heading, Text } from '@radix-ui/themes';
import type { SolanaChain } from '@solana/wallet-standard-chains';
import { ErrorBoundary } from 'react-error-boundary';

import { SlotIndicator } from './SlotIndicator';

/**
 * The network's current slot, updates the instant the chain changes. The
 * `key={chain}` resets its error boundary on a chain switch.
 */
export function SlotIndicatorPanel({ chain }: { chain: SolanaChain }) {
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
