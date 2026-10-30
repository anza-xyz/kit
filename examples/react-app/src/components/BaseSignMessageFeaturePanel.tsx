import { Pencil1Icon } from '@radix-ui/react-icons';
import { Blockquote, Box, Button, Code, DataList, Dialog, Flex, TextField } from '@radix-ui/themes';
import type { ReadonlyUint8Array } from '@solana/kit';
import { getBase64Decoder } from '@solana/kit';
import { useAction } from '@solana/react';
import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { ErrorDialog } from '../components/ErrorDialog';

/**
 * The result of signing a message: the signature, and the exact bytes it is a signature of. Those
 * bytes aren't always just the message text, so panels return them explicitly. For example, an
 * offchain message wraps the text with some extra information before the wallet signs it.
 */
export type SignedMessage = Readonly<{
    signature: ReadonlyUint8Array;
    signedMessage: ReadonlyUint8Array;
}>;

type Props = Readonly<{
    buttonLabel?: string;
    signMessage(text: string): Promise<SignedMessage>;
}>;

export function BaseSignMessageFeaturePanel({ buttonLabel = 'Sign Message', signMessage }: Props) {
    const [text, setText] = useState<string>();

    const {
        data: lastSigned,
        dispatch,
        error,
        isRunning: isSigningMessage,
        reset,
    } = useAction(async () => await signMessage(text ?? ''));

    return (
        <Flex asChild gap="2" direction={{ initial: 'column', sm: 'row' }} style={{ width: '100%' }}>
            <form
                onSubmit={e => {
                    e.preventDefault();
                    dispatch();
                }}
            >
                <Box flexGrow="1">
                    <TextField.Root
                        placeholder="Write a message to sign"
                        onChange={(e: SyntheticEvent<HTMLInputElement>) => setText(e.currentTarget.value)}
                        value={text}
                    >
                        <TextField.Slot>
                            <Pencil1Icon />
                        </TextField.Slot>
                    </TextField.Root>
                </Box>
                <Dialog.Root
                    open={!!lastSigned}
                    onOpenChange={open => {
                        if (!open) {
                            reset();
                        }
                    }}
                >
                    <Dialog.Trigger>
                        <Button
                            color={error ? 'red' : 'green'}
                            disabled={!text}
                            loading={isSigningMessage}
                            type="submit"
                        >
                            {buttonLabel}
                        </Button>
                    </Dialog.Trigger>
                    {lastSigned ? (
                        <Dialog.Content
                            onClick={e => {
                                e.stopPropagation();
                            }}
                        >
                            <Dialog.Title>You Signed a Message!</Dialog.Title>
                            <DataList.Root orientation={{ initial: 'vertical', sm: 'horizontal' }}>
                                <DataList.Item>
                                    <DataList.Label minWidth="88px">Message</DataList.Label>
                                    <DataList.Value>
                                        <Blockquote>{text}</Blockquote>
                                    </DataList.Value>
                                </DataList.Item>
                                <DataList.Item>
                                    <DataList.Label minWidth="88px">Signature</DataList.Label>
                                    <DataList.Value>
                                        <Code truncate>{getBase64Decoder().decode(lastSigned.signature)}</Code>
                                    </DataList.Value>
                                </DataList.Item>
                                <DataList.Item>
                                    <DataList.Label minWidth="88px">Signed Bytes</DataList.Label>
                                    <DataList.Value>
                                        <Code truncate>{getBase64Decoder().decode(lastSigned.signedMessage)}</Code>
                                    </DataList.Value>
                                </DataList.Item>
                            </DataList.Root>
                            <Flex gap="3" mt="4" justify="end">
                                <Dialog.Close>
                                    <Button>Cool!</Button>
                                </Dialog.Close>
                            </Flex>
                        </Dialog.Content>
                    ) : null}
                </Dialog.Root>
                {error ? <ErrorDialog error={error} onClose={reset} title="Failed to sign message" /> : null}
            </form>
        </Flex>
    );
}
