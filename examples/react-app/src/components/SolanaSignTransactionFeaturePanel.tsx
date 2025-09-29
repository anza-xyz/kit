import { Blockquote, Box, Button, Dialog, Flex, Link, Select, Text, TextField } from '@radix-ui/themes';
import {
    Address,
    address,
    appendTransactionMessageInstruction,
    assertIsSendableTransaction,
    createTransactionMessage,
    getSignatureFromTransaction,
    lamports,
    pipe,
    SendableTransaction,
    sendAndConfirmTransactionFactory,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    Signature,
    signTransactionMessageWithSigners,
    Transaction,
    TransactionWithBlockhashLifetime,
} from '@solana/kit';
import { useWalletAccountTransactionSigner } from '@solana/react';
import { getTransferSolInstruction } from '@solana-program/system';
import { getUiWalletAccountStorageKey, type UiWalletAccount, useWallets } from '@wallet-standard/react';
import type { SyntheticEvent } from 'react';
import { useContext, useId, useMemo, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

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

type SignTransactionState =
    | {
          kind: 'creating-transaction';
      }
    | {
          kind: 'inputs-form-active';
      }
    | {
          kind: 'ready-to-send';
          recipientAddress: Address;
          transaction: SendableTransaction & Transaction & TransactionWithBlockhashLifetime;
      }
    | {
          kind: 'sending-transaction';
      };

export function SolanaSignTransactionFeaturePanel({ account }: Props) {
    const { mutate } = useSWRConfig();
    const { current: NO_ERROR } = useRef(Symbol());
    const { rpc, rpcSubscriptions } = useContext(RpcContext);
    const sendAndConfirmTransaction = useMemo(
        () => sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions }),
        [rpc, rpcSubscriptions],
    );
    const wallets = useWallets();
    const [error, setError] = useState(NO_ERROR);
    const [lastSignature, setLastSignature] = useState<Signature | undefined>();
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
    const [signTransactionState, setSignTransactionState] = useState<SignTransactionState>({
        kind: 'inputs-form-active',
    });
    const formDisabled = signTransactionState.kind !== 'inputs-form-active';
    const formLoading =
        signTransactionState.kind === 'creating-transaction' || signTransactionState.kind === 'sending-transaction';

    async function handleCreateTransaction(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(NO_ERROR);
        setSignTransactionState({ kind: 'creating-transaction' });
        try {
            const amount = solStringToLamports(solQuantityString);
            if (!recipientAccount) {
                throw new Error('The address of the recipient could not be found');
            }
            const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();
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
            setSignTransactionState({
                kind: 'ready-to-send',
                recipientAddress: recipientAccount.address as Address,
                transaction,
            });
        } catch (e) {
            setLastSignature(undefined);
            setError(e);
            setSignTransactionState({ kind: 'inputs-form-active' });
        }
    }

    async function handleSendTransaction(
        {
            recipientAddress,
            transaction,
        }: {
            recipientAddress: Address;
            transaction: SendableTransaction & Transaction & TransactionWithBlockhashLifetime;
        },
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setError(NO_ERROR);
        setSignTransactionState({ kind: 'sending-transaction' });
        try {
            const signature = getSignatureFromTransaction(transaction);
            await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
            void mutate({ address: transactionSigner.address, chain: currentChain });
            void mutate({ address: recipientAddress, chain: currentChain });
            setLastSignature(signature);
            setSolQuantityString('');
            setSignTransactionState({ kind: 'inputs-form-active' });
        } catch (e) {
            setLastSignature(undefined);
            setError(e);
            setSignTransactionState({ kind: 'inputs-form-active' });
        }
    }

    return (
        <Flex asChild gap="2" direction={{ initial: 'column', sm: 'row' }} style={{ width: '100%' }}>
            <form
                onSubmit={
                    signTransactionState.kind === 'inputs-form-active'
                        ? handleCreateTransaction
                        : signTransactionState.kind === 'ready-to-send'
                          ? handleSendTransaction.bind(null, signTransactionState)
                          : undefined
                }
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
                                <TextField.Slot side="right">{'\u25ce'}</TextField.Slot>
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
                            setLastSignature(undefined);
                        }
                    }}
                >
                    <Dialog.Trigger>
                        <Button
                            color={error ? undefined : 'red'}
                            disabled={solQuantityString === '' || !recipientAccount}
                            loading={formLoading}
                            type="submit"
                        >
                            {signTransactionState.kind === 'ready-to-send' ? 'Send' : 'Sign'}
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
                {error !== NO_ERROR ? (
                    <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} title="Transfer failed" />
                ) : null}
            </form>
        </Flex>
    );
}
