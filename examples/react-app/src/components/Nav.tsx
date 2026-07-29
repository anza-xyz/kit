import { Badge, Box, DropdownMenu, Flex, Heading } from '@radix-ui/themes';
import { useClient } from '@solana/react';
import type { SolanaChain } from '@solana/wallet-standard-chains';

import { getChainDisplayName, SUPPORTED_CHAINS } from '../chain';
import type { AppClient } from '../context/ClientProvider';
import { ConnectWalletMenu } from './ConnectWalletMenu';
import { SignInMenu } from './SignInMenu';

type Props = Readonly<{
    onChainChange: (chain: SolanaChain) => void;
}>;

export function Nav({ onChainChange }: Props) {
    // Read the *active* chain off the client so the badge and the picker's selection track the client
    // the rest of the app is using (they update one render after a switch, once the client rebuilds).
    const { chain } = useClient<AppClient>();
    return (
        <Box
            style={{
                backgroundColor: 'var(--gray-1)',
                borderBottom: '1px solid var(--gray-a6)',
                zIndex: 1,
            }}
            position="sticky"
            p="3"
            top="0"
        >
            <Flex gap="4" justify="between" align="center">
                <Box flexGrow="1">
                    <Heading as="h1" size={{ initial: '4', xs: '6' }} truncate>
                        Solana React App{' '}
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                <Badge color="gray" style={{ verticalAlign: 'middle' }}>
                                    {getChainDisplayName(chain)}
                                </Badge>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content>
                                <DropdownMenu.RadioGroup
                                    onValueChange={value => {
                                        onChainChange(value as SolanaChain);
                                    }}
                                    value={chain}
                                >
                                    {SUPPORTED_CHAINS.map(supportedChain => (
                                        <DropdownMenu.RadioItem key={supportedChain} value={supportedChain}>
                                            {getChainDisplayName(supportedChain)}
                                        </DropdownMenu.RadioItem>
                                    ))}
                                </DropdownMenu.RadioGroup>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </Heading>
                </Box>
                <ConnectWalletMenu>Connect Wallet</ConnectWalletMenu>
                <SignInMenu>Sign In</SignInMenu>
            </Flex>
        </Box>
    );
}
