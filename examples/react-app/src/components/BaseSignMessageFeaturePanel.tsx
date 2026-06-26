import { Pencil1Icon } from '@radix-ui/react-icons';
import { Blockquote, Box, Button, DataList, Dialog, Flex, TextField } from '@radix-ui/themes';
import type { ReadonlyUint8Array } from '@wallet-standard/core';
import type { ReactNode, SyntheticEvent } from 'react';
import { useRef, useState } from 'react';

import { ErrorDialog } from '../components/ErrorDialog';

type Props<TResult> = Readonly<{
    renderSignedMessageDetails(result: TResult): ReactNode;
    signMessage(message: ReadonlyUint8Array): Promise<TResult>;
}>;

export function BaseSignMessageFeaturePanel<TResult>({ renderSignedMessageDetails, signMessage }: Props<TResult>) {
    const { current: NO_ERROR } = useRef(Symbol());
    const [isSigningMessage, setIsSigningMessage] = useState(false);
    const [error, setError] = useState(NO_ERROR);
    const [lastResult, setLastResult] = useState<TResult | undefined>();
    const [text, setText] = useState<string>();
    return (
        <Flex asChild gap="2" direction={{ initial: 'column', sm: 'row' }} style={{ width: '100%' }}>
            <form
                onSubmit={async e => {
                    e.preventDefault();
                    setError(NO_ERROR);
                    setIsSigningMessage(true);
                    try {
                        const result = await signMessage(new TextEncoder().encode(text));
                        setLastResult(result);
                    } catch (e) {
                        setLastResult(undefined);
                        setError(e);
                    } finally {
                        setIsSigningMessage(false);
                    }
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
                    open={lastResult !== undefined}
                    onOpenChange={open => {
                        if (!open) {
                            setLastResult(undefined);
                        }
                    }}
                >
                    <Dialog.Trigger>
                        <Button
                            color={error ? undefined : 'red'}
                            disabled={!text}
                            loading={isSigningMessage}
                            type="submit"
                        >
                            Sign Message
                        </Button>
                    </Dialog.Trigger>
                    {lastResult !== undefined ? (
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
                                {renderSignedMessageDetails(lastResult)}
                            </DataList.Root>
                            <Flex gap="3" mt="4" justify="end">
                                <Dialog.Close>
                                    <Button>Cool!</Button>
                                </Dialog.Close>
                            </Flex>
                        </Dialog.Content>
                    ) : null}
                </Dialog.Root>
                {error !== NO_ERROR ? (
                    <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} title="Failed to sign message" />
                ) : null}
            </form>
        </Flex>
    );
}
