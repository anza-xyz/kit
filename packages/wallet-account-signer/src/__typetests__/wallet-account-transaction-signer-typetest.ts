import { TransactionModifyingSigner } from '@solana/signers';
import { UiWalletAccount } from '@wallet-standard/ui';

import { createTransactionSignerFromWalletAccount } from '../wallet-account-transaction-signer';

const mockAccount = {
    address: 'Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy',
    chains: ['solana:devnet'],
    features: ['solana:signTransaction'],
} as unknown as UiWalletAccount;

{
    // [createSignerFromWalletAccount]: It returns a TransactionModifyingSigner with the correct address type.
    const signer = createTransactionSignerFromWalletAccount(mockAccount, 'solana:devnet');
    signer satisfies TransactionModifyingSigner<typeof mockAccount.address>;
}

{
    // [createSignerFromWalletAccount]: It exposes a modifyAndSignTransactions method.
    const signer = createTransactionSignerFromWalletAccount(mockAccount, 'solana:devnet');
    signer.modifyAndSignTransactions satisfies TransactionModifyingSigner['modifyAndSignTransactions'];
}

{
    // [createSignerFromWalletAccount]: It accepts any solana chain identifier.
    createTransactionSignerFromWalletAccount(mockAccount, 'solana:mainnet');
    createTransactionSignerFromWalletAccount(mockAccount, 'solana:devnet');
    createTransactionSignerFromWalletAccount(mockAccount, 'solana:testnet');
}

{
    // [createSignerFromWalletAccount]: It accepts any non-Solana chain identifier.
    createTransactionSignerFromWalletAccount(mockAccount, 'l2:mainnet');
}
