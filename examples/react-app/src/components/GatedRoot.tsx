import { Flex, Section, Spinner, Text } from '@radix-ui/themes';
import { WalletReadyGate } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';

import type { AppClient } from '../context/WalletClientProvider';
import Root from '../routes/root';

/**
 * The wallet-dependent view, held back by {@link WalletReadyGate} until the client published by
 * {@link WalletClientProvider} settles its initial auto-reconnect. Reads the client from context so
 * it can be passed to the gate.
 */
export function GatedRoot() {
    const client = useClient<AppClient>();
    return (
        <Section>
            <WalletReadyGate
                client={client}
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
    );
}
