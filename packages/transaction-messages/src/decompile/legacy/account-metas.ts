import { AccountMeta, AccountRole } from '@solana/instructions';

import { CompiledTransactionMessage } from '../..';

export function getAccountMetas(message: CompiledTransactionMessage): AccountMeta[] {
    const { header } = message;
    const numWritableSignerAccounts = header.numSignerAccounts - header.numReadonlySignerAccounts;
    const numWritableNonSignerAccounts =
        message.staticAccounts.length - header.numSignerAccounts - header.numReadonlyNonSignerAccounts;

    const accountMetas: AccountMeta[] = [];

    let accountIndex = 0;
    for (let i = 0; i < numWritableSignerAccounts; i++) {
        accountMetas.push({
            address: message.staticAccounts[accountIndex],
            role: AccountRole.WRITABLE_SIGNER,
        });
        accountIndex++;
    }

    for (let i = 0; i < header.numReadonlySignerAccounts; i++) {
        accountMetas.push({
            address: message.staticAccounts[accountIndex],
            role: AccountRole.READONLY_SIGNER,
        });
        accountIndex++;
    }

    for (let i = 0; i < numWritableNonSignerAccounts; i++) {
        accountMetas.push({
            address: message.staticAccounts[accountIndex],
            role: AccountRole.WRITABLE,
        });
        accountIndex++;
    }

    for (let i = 0; i < header.numReadonlyNonSignerAccounts; i++) {
        accountMetas.push({
            address: message.staticAccounts[accountIndex],
            role: AccountRole.READONLY,
        });
        accountIndex++;
    }

    return accountMetas;
}
