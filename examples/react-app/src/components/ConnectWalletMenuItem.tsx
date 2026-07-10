import { DropdownMenu } from '@radix-ui/themes';
import { isAbortError } from '@solana/kit';
import { useConnect, useConnectedWallet, useDisconnect, useSelectAccount } from '@solana/kit-plugin-wallet/react';
import { StandardDisconnect } from '@wallet-standard/core';
import type { UiWallet, UiWalletAccount } from '@wallet-standard/ui';
import { uiWalletAccountBelongsToUiWallet } from '@wallet-standard/ui';

import { WalletMenuItemContent } from './WalletMenuItemContent';

type Props = Readonly<{
    onAccountSelect(): void;
    onError(err: unknown): void;
    wallet: UiWallet;
}>;

export function ConnectWalletMenuItem({ onAccountSelect, onError, wallet }: Props) {
    const connect = useConnect();
    const disconnect = useDisconnect();
    const selectAccount = useSelectAccount();
    const connected = useConnectedWallet();
    const isPending = connect.isRunning || disconnect.isRunning;
    const isConnected = wallet.accounts.length > 0;
    // "Active" = the account currently driving the app's feature panels belongs to this wallet.
    const isActiveWallet = connected != null && uiWalletAccountBelongsToUiWallet(connected.account, wallet);
    // The active wallet can always be disconnected — the plugin tears the connection down locally
    // even when the wallet lacks `standard:disconnect`. Deauthorizing a *non-active* wallet
    // requires the feature, and without it the plugin's disconnect is a forgiving no-op — so
    // don't offer an action that would do nothing.
    const canDisconnect = isActiveWallet || wallet.features.includes(StandardDisconnect);

    async function connectWallet() {
        try {
            await connect.dispatchAsync(wallet);
            // Connecting establishes the active connection
            onAccountSelect();
        } catch (e) {
            // Filter out abort error, which just means a later connect superseded
            if (!isAbortError(e)) {
                onError(e);
            }
        }
    }

    function chooseAccount(account: UiWalletAccount) {
        try {
            // selectAccount is synchronous
            selectAccount(account);
            onAccountSelect();
        } catch (e) {
            onError(e);
        }
    }

    async function disconnectWallet() {
        try {
            // If this is the active wallet, it is fully disconnected; a non-active
            // authorized wallet is deauthorized while the active connection stays put.
            await disconnect.dispatchAsync(wallet);
        } catch (e) {
            if (!isAbortError(e)) {
                onError(e);
            }
        }
    }

    return (
        <DropdownMenu.Sub open={!isConnected ? false : undefined}>
            <DropdownMenu.SubTrigger
                disabled={isPending}
                onClick={
                    !isConnected
                        ? () => {
                              void connectWallet();
                          }
                        : undefined
                }
            >
                <WalletMenuItemContent loading={isPending} wallet={wallet} />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
                <DropdownMenu.Label>Accounts</DropdownMenu.Label>
                <DropdownMenu.RadioGroup value={isActiveWallet ? connected.account.address : undefined}>
                    {wallet.accounts.map(account => (
                        <DropdownMenu.RadioItem
                            key={account.address}
                            value={account.address}
                            onSelect={event => {
                                event.preventDefault();
                                chooseAccount(account);
                            }}
                        >
                            {account.address.slice(0, 8)}&hellip;
                        </DropdownMenu.RadioItem>
                    ))}
                </DropdownMenu.RadioGroup>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                    onSelect={event => {
                        event.preventDefault();
                        void connectWallet();
                    }}
                >
                    Connect More
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    color="red"
                    disabled={!canDisconnect}
                    onSelect={event => {
                        event.preventDefault();
                        void disconnectWallet();
                    }}
                >
                    Disconnect
                </DropdownMenu.Item>
            </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
    );
}
