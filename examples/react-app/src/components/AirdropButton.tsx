import { Blockquote, Button, Dialog, Flex, Link, Text } from '@radix-ui/themes';
import { Address, airdropFactory, lamports, Rpc, Signature, SolanaRpcApi } from '@solana/kit';
import { useCallback, useContext, useMemo, useRef, useState } from 'react';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';
import { ErrorDialog } from './ErrorDialog';

export function AirdropButton({ address }: { address: Address }) {
    const { current: NO_ERROR } = useRef<unknown>(Symbol());
    const { chain } = useContext(ChainContext);
    const { rpc, rpcSubscriptions } = useContext(RpcContext);
    const [error, setError] = useState(NO_ERROR);
    const [lastSignature, setLastSignature] = useState<Signature | undefined>();

    const isMainnet = chain === 'solana:mainnet';

    // Cast RPC for airdrop, this is safe because we disable the airdrop button on mainnet
    const airdrop = useMemo(
        () => airdropFactory({ rpc: rpc as Rpc<SolanaRpcApi>, rpcSubscriptions }),
        [rpc, rpcSubscriptions],
    );
    const [loading, setLoading] = useState(false);

    const handleAirdrop = useCallback(async () => {
        try {
            if (isMainnet) throw new Error('Airdrops are not available on mainnet');
            setLoading(true);
            const signature = await airdrop({
                commitment: 'confirmed',
                lamports: lamports(1_000_000_000n),
                recipientAddress: address,
            });
            setLastSignature(signature);
            setError(NO_ERROR);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [airdrop, address, setLoading, NO_ERROR, isMainnet]);

    return (
        <>
            <Dialog.Root
                open={!!lastSignature}
                onOpenChange={open => {
                    if (!open) {
                        setLastSignature(undefined);
                    }
                }}
            >
                <Dialog.Trigger>
                    <Button
                        variant="outline"
                        color={error ? undefined : 'red'}
                        disabled={isMainnet}
                        loading={loading}
                        type="button"
                        onClick={handleAirdrop}
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

            {error !== NO_ERROR ? (
                <ErrorDialog
                    error={{ message: `This is usually because of rate limiting. Address: ${address}` }}
                    onClose={() => setError(NO_ERROR)}
                    title="Airdrop failed"
                />
            ) : null}
        </>
    );
}
