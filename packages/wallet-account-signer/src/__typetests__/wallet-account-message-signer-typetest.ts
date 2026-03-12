import { MessageModifyingSigner } from '@solana/signers';
import { UiWalletAccount } from '@wallet-standard/ui';

import { createMessageSignerFromWalletAccount } from '../wallet-account-message-signer';

const mockAccount = {
    address: 'Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy',
    chains: ['solana:devnet'],
    features: ['solana:signMessage'],
} as unknown as UiWalletAccount;

{
    // [createMessageSignerFromWalletAccount]: It returns a MessageModifyingSigner with the correct address type.
    const signer = createMessageSignerFromWalletAccount(mockAccount);
    signer satisfies MessageModifyingSigner<typeof mockAccount.address>;
}

{
    // [createMessageSignerFromWalletAccount]: It exposes a modifyAndSignMessages method.
    const signer = createMessageSignerFromWalletAccount(mockAccount);
    signer.modifyAndSignMessages satisfies MessageModifyingSigner['modifyAndSignMessages'];
}
