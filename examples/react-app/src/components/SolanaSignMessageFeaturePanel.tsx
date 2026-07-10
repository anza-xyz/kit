import { useSignMessage } from '@solana/kit-plugin-wallet/react';
import type { UiWalletAccount } from '@wallet-standard/ui';

import { assertCanSignMessages } from '../walletCapability';
import { BaseSignMessageFeaturePanel } from './BaseSignMessageFeaturePanel';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

export function SolanaSignMessageFeaturePanel({ account }: Props) {
    const { dispatchAsync } = useSignMessage();
    // Guard at render so the surrounding `ErrorBoundary` shows `FeatureNotSupportedCallout`
    // when the connected account lacks it.
    assertCanSignMessages(account);
    return <BaseSignMessageFeaturePanel signMessage={dispatchAsync} />;
}
