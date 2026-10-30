import { address } from '@solana/kit';
import { useSignOffchainMessage } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';
import type { UiWalletAccount } from '@wallet-standard/ui';

import type { AppClient } from '../context/ClientProvider';
import { assertCanSignOffchainMessages } from '../walletCapability';
import { BaseSignMessageFeaturePanel } from './BaseSignMessageFeaturePanel';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

/**
 * Signs a version 1 Solana offchain message with the connected account.
 *
 * The plugin verifies the wallet's response before resolving — the signed bytes must be exactly
 * the encoding of the requested message, and the signature must be valid for the connected
 * account — so the envelope can be displayed as-is.
 */
export function SolanaSignOffchainMessageFeaturePanel({ account }: Props) {
    const client = useClient<AppClient>();
    const { dispatchAsync } = useSignOffchainMessage(client);
    // Guard at render so the surrounding `ErrorBoundary` shows `FeatureNotSupportedCallout`
    // when the connected account lacks it.
    assertCanSignOffchainMessages(account);
    return (
        <BaseSignMessageFeaturePanel
            buttonLabel="Sign Offchain Message"
            signMessage={async text => {
                const { content, signatures } = await dispatchAsync({ message: text, version: 1 });
                // With the default single required signer, the envelope is fully signed by the
                // connected account.
                const signature = signatures[address(account.address)];
                if (!signature) {
                    throw new Error('The wallet did not sign the offchain message');
                }
                return { signature, signedMessage: content };
            }}
        />
    );
}
