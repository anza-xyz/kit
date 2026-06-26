import { Code, DataList } from '@radix-ui/themes';
import { getBase64Decoder } from '@solana/kit';
import { SolanaSignOffchainMessage, SolanaSignOffchainMessageFeature } from '@solana/wallet-standard-features';
import type { ReadonlyUint8Array } from '@wallet-standard/core';
import type { UiWalletAccount } from '@wallet-standard/react';
import { getWalletAccountFeature } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';
import { useCallback } from 'react';

import { BaseSignMessageFeaturePanel } from './BaseSignMessageFeaturePanel';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

export function SolanaSignOffchainMessageFeaturePanel({ account }: Props) {
    const signOffchainMessageFeature = getWalletAccountFeature(
        account,
        SolanaSignOffchainMessage,
    ) as SolanaSignOffchainMessageFeature[typeof SolanaSignOffchainMessage];
    const walletAccount = getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(account);
    const signMessage = useCallback(
        async (message: ReadonlyUint8Array) => {
            const [result] = await signOffchainMessageFeature.signOffchainMessage({
                account: walletAccount,
                // The base panel hands us UTF-8 bytes; the v1 feature wants the text as a string.
                message: new TextDecoder().decode(message),
                messageVersion: 1,
                // Sign as a single-signatory message using only the connected account.
                requiredSigners: [account.publicKey],
            });
            return result;
        },
        [account.publicKey, signOffchainMessageFeature, walletAccount],
    );
    return (
        <BaseSignMessageFeaturePanel
            renderSignedMessageDetails={result => (
                <>
                    <DataList.Item>
                        <DataList.Label minWidth="88px">Signed Offchain Message</DataList.Label>
                        <DataList.Value>
                            <Code truncate>{getBase64Decoder().decode(result.signedOffchainMessage)}</Code>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                        <DataList.Label minWidth="88px">Signature</DataList.Label>
                        <DataList.Value>
                            <Code truncate>{getBase64Decoder().decode(result.signature)}</Code>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                        <DataList.Label minWidth="88px">Signature Type</DataList.Label>
                        <DataList.Value>
                            <Code>{result.signatureType ?? 'ed25519 (default)'}</Code>
                        </DataList.Value>
                    </DataList.Item>
                </>
            )}
            signMessage={signMessage}
        />
    );
}
