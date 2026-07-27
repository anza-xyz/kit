import { useSignMessage } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';
import type { UiWalletAccount } from '@wallet-standard/ui';

import type { AppClient } from '../context/WalletClientProvider';
import { assertCanSignMessages } from '../walletCapability';
import { BaseSignMessageFeaturePanel } from './BaseSignMessageFeaturePanel';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

export function SolanaSignMessageFeaturePanel({ account }: Props) {
    const client = useClient<AppClient>();
    const { dispatchAsync } = useSignMessage(client);
    // Guard at render so the surrounding `ErrorBoundary` shows `FeatureNotSupportedCallout`
    // when the connected account lacks it.
    assertCanSignMessages(account);
    return <BaseSignMessageFeaturePanel signMessage={dispatchAsync} />;
}
