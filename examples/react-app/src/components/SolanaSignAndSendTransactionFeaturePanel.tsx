import { Blockquote, Box, Button, Dialog, Flex, Link, Select, Text, TextField } from '@radix-ui/themes';
import { address } from '@solana/kit';
import { useConnectedWallet, useWallets } from '@solana/kit-plugin-wallet/react';
import { useClient, useSendTransaction } from '@solana/react';
import { getTransferSolInstruction } from '@solana-program/system';
import { getUiWalletAccountStorageKey } from '@wallet-standard/ui';
import type { SyntheticEvent } from 'react';
import { useId, useMemo, useState } from 'react';

import { getExplorerClusterName } from '../chain';
import type { AppClient } from '../context/ClientProvider';
import { solStringToLamports } from '../lamports';
import { assertCanSignTransactions } from '../walletCapability';
import { ErrorDialog } from './ErrorDialog';
import { WalletMenuItemContent } from './WalletMenuItemContent';

export function SolanaSignAndSendTransactionFeaturePanel() {
    const client = useClient<AppClient>();
    const wallets = useWallets(client);
    const connectedWallet = useConnectedWallet(client);
    const [solQuantityString, setSolQuantityString] = useState<string>('');
    const [recipientAccountStorageKey, setRecipientAccountStorageKey] = useState<string | undefined>();
    const recipientAccount = useMemo(() => {
        if (recipientAccountStorageKey) {
            for (const wallet of wallets) {
                for (const account of wallet.accounts) {
                    if (getUiWalletAccountStorageKey(account) === recipientAccountStorageKey) {
                        return account;
                    }
                }
            }
        }
    }, [recipientAccountStorageKey, wallets]);
    const currentChain = client.chain;
    const solanaExplorerClusterName = getExplorerClusterName(currentChain);
    const lamportsInputId = useId();
    const recipientSelectId = useId();

    const signer = connectedWallet?.signer ?? null;
    // Render-time capability guard: throws so the surrounding `ErrorBoundary` renders
    // `FeatureNotSupportedCallout` when the connected account can't sign transactions.
    // This also narrows `signer` to a `TransactionSigner` for use as
    // the transfer `source` below.
    assertCanSignTransactions(signer);

    const { data: result, dispatchAsync, error, isRunning: isSendingTransaction, reset } = useSendTransaction(client);
    const lastSignature = result?.context.signature;

    return (
        <Flex asChild gap="2" direction={{ initial: 'column', sm: 'row' }} style={{ width: '100%' }}>
            <form
                onSubmit={async e => {
                    e.preventDefault();
                    if (!recipientAccount) {
                        return;
                    }
                    try {
                        await dispatchAsync(
                            getTransferSolInstruction({
                                amount: solStringToLamports(solQuantityString),
                                destination: address(recipientAccount.address),
                                source: signer,
                            }),
                        );
                        setSolQuantityString('');
                    } catch {
                        // Error is surfaced by `useSendTransaction`'s `error` field
                    }
                }}
            >
                <Box flexGrow="1" overflow="hidden">
                    <Flex gap="3" align="center">
                        <Box flexGrow="1" minWidth="90px" maxWidth="130px">
                            <TextField.Root
                                disabled={isSendingTransaction}
                                id={lamportsInputId}
                                placeholder="Amount"
                                onChange={(e: SyntheticEvent<HTMLInputElement>) =>
                                    setSolQuantityString(e.currentTarget.value)
                                }
                                style={{ width: 'auto' }}
                                type="number"
                                value={solQuantityString}
                            >
                                <TextField.Slot side="right">{'◎'}</TextField.Slot>
                            </TextField.Root>
                        </Box>
                        <Box flexShrink="0">
                            <Text as="label" color="gray" htmlFor={recipientSelectId} weight="medium">
                                To Account
                            </Text>
                        </Box>
                        <Select.Root
                            disabled={isSendingTransaction}
                            onValueChange={setRecipientAccountStorageKey}
                            value={recipientAccount ? getUiWalletAccountStorageKey(recipientAccount) : undefined}
                        >
                            <Select.Trigger
                                style={{ flexGrow: 1, flexShrink: 1, overflow: 'hidden' }}
                                placeholder="Select a Connected Account"
                            />
                            <Select.Content>
                                {wallets.flatMap(wallet =>
                                    wallet.accounts
                                        .filter(({ chains }) => chains.includes(currentChain))
                                        .map(account => {
                                            const key = getUiWalletAccountStorageKey(account);
                                            return (
                                                <Select.Item key={key} value={key}>
                                                    <WalletMenuItemContent wallet={wallet}>
                                                        {account.address}
                                                    </WalletMenuItemContent>
                                                </Select.Item>
                                            );
                                        }),
                                )}
                            </Select.Content>
                        </Select.Root>
                    </Flex>
                </Box>
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
                            color={error ? 'red' : 'green'}
                            disabled={solQuantityString === '' || !recipientAccount}
                            loading={isSendingTransaction}
                            type="submit"
                        >
                            Transfer
                        </Button>
                    </Dialog.Trigger>
                    {lastSignature ? (
                        <Dialog.Content
                            onClick={e => {
                                e.stopPropagation();
                            }}
                        >
                            <Dialog.Title>You transferred tokens!</Dialog.Title>
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
                {error ? <ErrorDialog error={error} onClose={reset} title="Transfer failed" /> : null}
            </form>
        </Flex>
    );
}
