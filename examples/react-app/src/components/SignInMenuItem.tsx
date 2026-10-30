import { DropdownMenu } from '@radix-ui/themes';
import { isAbortError } from '@solana/kit';
import { supportsSignInWithOffchainMessage } from '@solana/kit-plugin-wallet';
import { useSignIn } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';
import type { UiWallet } from '@wallet-standard/ui';
import type { MouseEvent } from 'react';

import type { AppClient } from '../context/ClientProvider';
import { WalletMenuItemContent } from './WalletMenuItemContent';

type Props = Readonly<{
    onError(err: unknown): void;
    onSignIn(): void;
    wallet: UiWallet;
}>;

export function SignInMenuItem({ onSignIn, onError, wallet }: Props) {
    const client = useClient<AppClient>();
    const signIn = useSignIn(client);
    async function handleSignInClick(e: MouseEvent) {
        e.preventDefault();
        try {
            await signIn.dispatchAsync(wallet, {
                domain: window.location.host,
                statement: 'You will enjoy being signed in.',
                // Wallets with `solana:signIn` >= 1.1.0 can sign the SIWS text wrapped in an
                // offchain message, which hardware wallets can display and sign. Older wallets
                // don't support the option, so only send it when the wallet advertises support.
                ...(supportsSignInWithOffchainMessage(wallet) && { useOffchainMessage: { messageVersion: 1 } }),
            });
            onSignIn();
        } catch (e) {
            // Filter out abort error, which just means a later action superseded
            if (!isAbortError(e)) {
                onError(e);
            }
        }
    }
    return (
        <DropdownMenu.Item
            onClick={e => {
                void handleSignInClick(e);
            }}
        >
            <WalletMenuItemContent loading={signIn.isRunning} wallet={wallet} />
        </DropdownMenu.Item>
    );
}
