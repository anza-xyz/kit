import { Container, Flex, Section, Spinner, Text } from '@radix-ui/themes';

import { useHasWalletSettled } from '../hooks/useHasWalletSettled';
import Root from '../routes/root';

/**
 * The wallet-dependent view, held behind a lightweight placeholder only until the wallet first
 * settles its initial auto-reconnect ({@link useHasWalletSettled}). Later chain-switch warm-ups are
 * handled by per-cell dimming inside `Root`, not by re-showing this gate.
 */
export function GatedRoot() {
    const hasSettled = useHasWalletSettled();
    return (
        <Section>
            <Container mx={{ initial: '3', xs: '6' }}>
                {hasSettled ? (
                    <Root />
                ) : (
                    <Flex align="center" justify="center" gap="2" p="9">
                        <Spinner loading />
                        <Text as="p">Connecting to your wallet&hellip;</Text>
                    </Flex>
                )}
            </Container>
        </Section>
    );
}
