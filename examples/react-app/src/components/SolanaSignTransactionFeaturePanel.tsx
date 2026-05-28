import { Blockquote, Box, Button, Dialog, Flex, Link, Select, Text, TextField } from '@radix-ui/themes';
import {
    address,
    appendTransactionMessageInstruction,
    assertIsSendableTransaction,
    assertIsTransactionWithBlockhashLifetime,
    createTransactionMessage,
    getSignatureFromTransaction,
    lamports,
    pipe,
    sendAndConfirmTransactionFactory,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
} from '@solana/kit';
import { useAction, useWalletAccountTransactionSigner } from '@solana/react';
import { getTransferSolInstruction } from '@solana-program/system';
import { getUiWalletAccountStorageKey, type UiWalletAccount, useWallets } from '@wallet-standard/react';
import type { SyntheticEvent } from 'react';
import { useContext, useId, useMemo, useState } from 'react';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';
import { ErrorDialog } from './ErrorDialog';
import { WalletMenuItemContent } from './WalletMenuItemContent';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

function solStringToLamports(solQuantityString: string) {
    if (Number.isNaN(parseFloat(solQuantityString))) {
        throw new Error('Could not parse token quantity: ' + String(solQuantityString));
    }
    const formatter = new Intl.NumberFormat('en-US', { useGrouping: false });
    const bigIntLamports = BigInt(
        // @ts-expect-error - scientific notation is supported by `Intl.NumberFormat` but the types are wrong
        formatter.format(`${solQuantityString}E9`).split('.')[0],
    );
    return lamports(bigIntLamports);
}

export function SolanaSignTransactionFeaturePanel({ account }: Props) {
    const { rpc, rpcSubscriptions } = useContext(RpcContext);
    const sendAndConfirmTransaction = useMemo(
        () => sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions }),
        [rpc, rpcSubscriptions],
    );
    const wallets = useWallets();
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
    const { chain: currentChain, solanaExplorerClusterName } = useContext(ChainContext);
    const transactionSigner = useWalletAccountTransactionSigner(account, currentChain);
    const lamportsInputId = useId();
    const recipientSelectId = useId();

    // Step one: build and sign the transaction
    const signAction = useAction(async signal => {
        const amount = solStringToLamports(solQuantityString);
        if (!recipientAccount) {
            throw new Error('The address of the recipient could not be found');
        }
        const { value: latestBlockhash } = await rpc
            .getLatestBlockhash({ commitment: 'confirmed' })
            .send({ abortSignal: signal });
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayerSigner(transactionSigner, m),
            m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
            m =>
                appendTransactionMessageInstruction(
                    getTransferSolInstruction({
                        amount,
                        destination: address(recipientAccount.address),
                        source: transactionSigner,
                    }),
                    m,
                ),
        );
        const transaction = await signTransactionMessageWithSigners(message);
        assertIsSendableTransaction(transaction);
        assertIsTransactionWithBlockhashLifetime(transaction);
        return transaction;
    });

    // Step two: send the already-signed transaction and wait for confirmation. The on-chain balance
    // refreshes itself through the `useTrackedDataSWR` subscription in `Balance`, so there's no
    // cache to invalidate here.
    const sendAction = useAction(async (signal, transaction: NonNullable<typeof signAction.data>) => {
        await sendAndConfirmTransaction(transaction, { abortSignal: signal, commitment: 'confirmed' });
        return getSignatureFromTransaction(transaction);
    });

    const signedTransaction = signAction.data;
    const lastSignature = sendAction.data;
    const readyToSend = signedTransaction != null && lastSignature == null;
    const formLoading = signAction.isRunning || sendAction.isRunning;
    const formDisabled = formLoading || readyToSend;
    const error = signAction.error ?? sendAction.error;

    function reset() {
        signAction.reset();
        sendAction.reset();
    }

    return (
        <Flex asChild gap="2" direction={{ initial: 'column', sm: 'row' }} style={{ width: '100%' }}>
            <form
                onSubmit={async e => {
                    e.preventDefault();
                    try {
                        if (readyToSend) {
                            await sendAction.dispatchAsync(signedTransaction);
                            setSolQuantityString('');
                        } else {
                            await signAction.dispatchAsync();
                        }
                    } catch {
                        // Error state is surfaced via the actions' `error` fields; nothing else to do here.
                    }
                }}
            >
                <Box flexGrow="1" overflow="hidden">
                    <Flex gap="3" align="center">
                        <Box flexGrow="1" minWidth="90px" maxWidth="130px">
                            <TextField.Root
                                disabled={formDisabled}
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
                            disabled={formDisabled}
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
                            color={error ? 'red' : readyToSend ? 'green' : undefined}
                            disabled={solQuantityString === '' || !recipientAccount}
                            loading={formLoading}
                            type="submit"
                        >
                            {readyToSend ? 'Send' : 'Sign'}
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
