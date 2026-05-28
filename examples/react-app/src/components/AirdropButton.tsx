import { Blockquote, Button, Dialog, Flex, Link, Text } from '@radix-ui/themes';
import { Address, airdropFactory, lamports, Rpc, SolanaRpcApi } from '@solana/kit';
import { useAction } from '@solana/react';
import { useContext, useMemo } from 'react';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';
import { ErrorDialog } from './ErrorDialog';

export function AirdropButton({ address }: { address: Address }) {
    const { chain, solanaExplorerClusterName } = useContext(ChainContext);
    const { rpc, rpcSubscriptions } = useContext(RpcContext);

    const isMainnet = chain === 'solana:mainnet';

    // Cast RPC for airdrop, this is safe because we disable the airdrop button on mainnet
    const airdrop = useMemo(
        () => airdropFactory({ rpc: rpc as Rpc<SolanaRpcApi>, rpcSubscriptions }),
        [rpc, rpcSubscriptions],
    );

    const {
        data: lastSignature,
        dispatch,
        error,
        isRunning,
        reset,
    } = useAction(async () => {
        if (isMainnet) throw new Error('Airdrops are not available on mainnet');
        return await airdrop({
            commitment: 'confirmed',
            lamports: lamports(1_000_000_000n),
            recipientAddress: address,
        });
    });

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
                        color={error ? undefined : 'red'}
                        disabled={isMainnet}
                        loading={isRunning}
                        type="button"
                        onClick={() => void dispatch()}
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
