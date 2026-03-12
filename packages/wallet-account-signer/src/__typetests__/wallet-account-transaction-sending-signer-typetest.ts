import { TransactionSendingSigner } from '@solana/signers';
import { UiWalletAccount } from '@wallet-standard/ui';

import { createTransactionSendingSignerFromWalletAccount } from '../wallet-account-transaction-sending-signer';

const mockAccount = {
    address: 'Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy',
    chains: ['solana:devnet'],
    features: ['solana:signAndSendTransaction'],
} as unknown as UiWalletAccount;

{
    // [createSendingSignerFromWalletAccount]: It returns a TransactionSendingSigner with the correct address type.
    const signer = createTransactionSendingSignerFromWalletAccount(mockAccount, 'solana:devnet');
    signer satisfies TransactionSendingSigner<typeof mockAccount.address>;
}

{
    // [createSendingSignerFromWalletAccount]: It exposes a signAndSendTransactions method.
    const signer = createTransactionSendingSignerFromWalletAccount(mockAccount, 'solana:devnet');
    signer.signAndSendTransactions satisfies TransactionSendingSigner['signAndSendTransactions'];
}

{
    // [createSendingSignerFromWalletAccount]: It accepts any solana chain identifier.
    createTransactionSendingSignerFromWalletAccount(mockAccount, 'solana:mainnet');
    createTransactionSendingSignerFromWalletAccount(mockAccount, 'solana:devnet');
    createTransactionSendingSignerFromWalletAccount(mockAccount, 'solana:testnet');
}
