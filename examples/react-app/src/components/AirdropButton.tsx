import { Blockquote, Button, Dialog, Flex, Link, Text } from '@radix-ui/themes';
import { Address, ClientWithAirdrop, lamports } from '@solana/kit';
import { useAirdrop, useClient } from '@solana/react';

import { getExplorerClusterName } from '../chain';
import type { AppClient } from '../context/ClientProvider';
import { ErrorDialog } from './ErrorDialog';

export function AirdropButton({ address }: { address: Address }) {
    const client = useClient<AppClient>();
    // Airdrops aren't available on mainnet, whose client carries no `airdrop` capability. Narrow on
    // its presence: absent (mainnet) → a permanently disabled button; present → the working control,
    // which lives in its own component so `useAirdrop` is always called unconditionally.
    if (!('airdrop' in client)) {
        return (
            <Button disabled type="button" variant="outline">
                Airdrop to fee payer
            </Button>
        );
    }
    return <AirdropToFeePayerButton address={address} client={client} />;
}

function AirdropToFeePayerButton({
    address,
    client,
}: {
    address: Address;
    client: Extract<AppClient, ClientWithAirdrop>;
}) {
    const solanaExplorerClusterName = getExplorerClusterName(client.chain);
    const { data: lastSignature, dispatch, error, isRunning, reset } = useAirdrop(client);

    return (
        <>
            <Dialog.Root
                open={!!lastSignature}
                onOpenChange={open => {
                    if (!open) {
                        reset();
                    }
                }}
            >
                <Dialog.Trigger>
                    <Button
                        variant="outline"
                        color={error ? 'red' : undefined}
                        loading={isRunning}
                        type="button"
                        onClick={() => dispatch(address, lamports(1_000_000_000n))}
                    >
                        Airdrop to fee payer
                    </Button>
                </Dialog.Trigger>
                {lastSignature ? (
                    <Dialog.Content
                        onClick={e => {
                            e.stopPropagation();
                        }}
                    >
                        <Dialog.Title>Airdrop successful!</Dialog.Title>
                        <Flex direction="column" gap="2">
                            <Text>Signature:</Text>
                            <Blockquote>{lastSignature}</Blockquote>
                            <Text>
                                <Link
                                    href={`https://explorer.solana.com/tx/${lastSignature}?cluster=${solanaExplorerClusterName}`}
                                    target="_blank"
                                >
                                    View this transaction
                                </Link>{' '}
                                on Explorer
                            </Text>
                        </Flex>
                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button>Cool!</Button>
                            </Dialog.Close>
                        </Flex>
                    </Dialog.Content>
                ) : null}
            </Dialog.Root>

            {error ? (
                <ErrorDialog
                    error={{ message: `This is usually because of rate limiting. Address: ${address}` }}
                    onClose={reset}
                    title="Airdrop failed"
                />
            ) : null}
        </>
    );
}
