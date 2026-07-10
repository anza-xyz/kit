import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Button, Callout, DropdownMenu } from '@radix-ui/themes';
import { useConnectedWallet, useWallets } from '@solana/kit-plugin-wallet/react';
import type { UiWallet } from '@wallet-standard/ui';
import { useContext, useRef, useState } from 'react';

import { ChainContext } from '../context/ChainContext';
import { ConnectWalletMenuItem } from './ConnectWalletMenuItem';
import { ErrorDialog } from './ErrorDialog';
import { WalletAccountIcon } from './WalletAccountIcon';

type Props = Readonly<{
    children: React.ReactNode;
}>;

export function ConnectWalletMenu({ children }: Props) {
    const { current: NO_ERROR } = useRef(Symbol());
    const { displayName: currentChainName } = useContext(ChainContext);
    const wallets = useWallets();
    const connected = useConnectedWallet();
    const [error, setError] = useState(NO_ERROR);
    const [forceClose, setForceClose] = useState(false);
    // Every wallet from `useWallets()` is pre-filtered by the plugin to those that support
    // `standard:connect` on the active chain, so every item rendered here is connectable.
    function renderItem(wallet: UiWallet) {
        return (
            <ConnectWalletMenuItem
                key={`wallet:${wallet.name}`}
                onAccountSelect={() => setForceClose(true)}
                onError={setError}
                wallet={wallet}
            />
        );
    }
    return (
        <>
            <DropdownMenu.Root open={forceClose ? false : undefined} onOpenChange={setForceClose.bind(null, false)}>
                <DropdownMenu.Trigger>
                    <Button>
                        {connected ? (
                            <>
                                <WalletAccountIcon account={connected.account} width="18" height="18" />
                                {connected.account.address.slice(0, 8)}
                            </>
                        ) : (
                            children
                        )}
                        <DropdownMenu.TriggerIcon />
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    {wallets.length === 0 ? (
                        <Callout.Root color="orange" highContrast>
                            <Callout.Icon>
                                <ExclamationTriangleIcon />
                            </Callout.Icon>
                            {/* Wallets that don't support `standard:connect` on the current
                                chain are filtered out by the plugin, so an empty list doesn't
                                necessarily mean no wallets are installed. */}
                            <Callout.Text>
                                This browser has no wallets installed that support {currentChainName}.
                            </Callout.Text>
                        </Callout.Root>
                    ) : (
                        wallets.map(renderItem)
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
            {error !== NO_ERROR ? <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} /> : null}
        </>
    );
}
