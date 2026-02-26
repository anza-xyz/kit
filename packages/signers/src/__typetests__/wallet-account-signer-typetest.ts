import { UiWalletAccount } from '@wallet-standard/ui';

import { TransactionModifyingSigner } from '../transaction-modifying-signer';
import { createSignerFromWalletAccount } from '../wallet-account-signer';

const mockAccount = {
    address: 'Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy',
    chains: ['solana:devnet'],
    features: ['solana:signTransaction'],
} as unknown as UiWalletAccount;

{
    // [createSignerFromWalletAccount]: It returns a TransactionModifyingSigner with the correct address type.
    const signer = createSignerFromWalletAccount(mockAccount, 'solana:devnet');
    signer satisfies TransactionModifyingSigner<typeof mockAccount.address>;
}

{
    // [createSignerFromWalletAccount]: It exposes a modifyAndSignTransactions method.
    const signer = createSignerFromWalletAccount(mockAccount, 'solana:devnet');
    signer.modifyAndSignTransactions satisfies TransactionModifyingSigner['modifyAndSignTransactions'];
}

{
    // [createSignerFromWalletAccount]: It accepts any solana chain identifier.
    createSignerFromWalletAccount(mockAccount, 'solana:mainnet');
    createSignerFromWalletAccount(mockAccount, 'solana:devnet');
    createSignerFromWalletAccount(mockAccount, 'solana:testnet');
}
