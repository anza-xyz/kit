import { UiWalletAccount } from '@wallet-standard/ui';

import { TransactionSendingSigner } from '../transaction-sending-signer';
import { createSendingSignerFromWalletAccount } from '../wallet-account-sending-signer';

const mockAccount = {
    address: 'Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy',
    chains: ['solana:devnet'],
    features: ['solana:signAndSendTransaction'],
} as unknown as UiWalletAccount;

{
    // [createSendingSignerFromWalletAccount]: It returns a TransactionSendingSigner with the correct address type.
    const signer = createSendingSignerFromWalletAccount(mockAccount, 'solana:devnet');
    signer satisfies TransactionSendingSigner<typeof mockAccount.address>;
}

{
    // [createSendingSignerFromWalletAccount]: It exposes a signAndSendTransactions method.
    const signer = createSendingSignerFromWalletAccount(mockAccount, 'solana:devnet');
    signer.signAndSendTransactions satisfies TransactionSendingSigner['signAndSendTransactions'];
}

{
    // [createSendingSignerFromWalletAccount]: It accepts any solana chain identifier.
    createSendingSignerFromWalletAccount(mockAccount, 'solana:mainnet');
    createSendingSignerFromWalletAccount(mockAccount, 'solana:devnet');
    createSendingSignerFromWalletAccount(mockAccount, 'solana:testnet');
}
