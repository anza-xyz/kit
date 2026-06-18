import { Code, DataList } from '@radix-ui/themes';
import type { Address } from '@solana/kit';
import { getBase64Decoder } from '@solana/kit';
import { useWalletAccountMessageSigner } from '@solana/react';
import type { ReadonlyUint8Array } from '@wallet-standard/core';
import type { UiWalletAccount } from '@wallet-standard/react';
import { useCallback } from 'react';

import { BaseSignMessageFeaturePanel } from './BaseSignMessageFeaturePanel';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

export function SolanaSignMessageFeaturePanel({ account }: Props) {
    const messageSigner = useWalletAccountMessageSigner(account);
    const signMessage = useCallback(
        async (message: ReadonlyUint8Array) => {
            const [result] = await messageSigner.modifyAndSignMessages([
                {
                    content: message as Uint8Array,
                    signatures: {},
                },
            ]);
            const signature = result?.signatures[account.address as Address];
            if (!signature) {
                throw new Error();
            }
            return signature as ReadonlyUint8Array;
        },
        [account.address, messageSigner],
    );
    return (
        <BaseSignMessageFeaturePanel
            renderSignedMessageDetails={signature => (
                <DataList.Item>
                    <DataList.Label minWidth="88px">Signature</DataList.Label>
                    <DataList.Value>
                        <Code truncate>{getBase64Decoder().decode(signature)}</Code>
                    </DataList.Value>
                </DataList.Item>
            )}
            signMessage={signMessage}
        />
    );
}
