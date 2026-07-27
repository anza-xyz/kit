import { useWallets } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';
import type { UiWalletAccount } from '@wallet-standard/ui';
import { uiWalletAccountBelongsToUiWallet } from '@wallet-standard/ui';
import React from 'react';

import type { AppClient } from '../context/WalletClientProvider';

type Props = React.ComponentProps<'img'> &
    Readonly<{
        account: UiWalletAccount;
    }>;

export function WalletAccountIcon({ account, ...imgProps }: Props) {
    const client = useClient<AppClient>();
    const wallets = useWallets(client);
    let icon;
    if (account.icon) {
        icon = account.icon;
    } else {
        for (const wallet of wallets) {
            if (uiWalletAccountBelongsToUiWallet(account, wallet)) {
                icon = wallet.icon;
                break;
            }
        }
    }
    return icon ? <img src={icon} {...imgProps} /> : null;
}
