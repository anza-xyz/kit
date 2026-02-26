import { Address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';

import { CompiledTransactionMessage } from '../../..';
import { getAccountMetas } from '../account-metas';

describe('getAccountMetas', () => {
    it('should return account metas with all four types of accounts', () => {
        const compiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 2,
                numReadonlySignerAccounts: 1,
                numSignerAccounts: 3,
            },
            staticAccounts: [
                'writable-signer-1' as Address,
                'writable-signer-2' as Address,
                'readonly-signer' as Address,
                'writable-non-signer-1' as Address,
                'writable-non-signer-2' as Address,
                'readonly-non-signer-1' as Address,
                'readonly-non-signer-2' as Address,
            ],
        } as CompiledTransactionMessage;

        const accountMetas = getAccountMetas(compiledTransactionMessage);

        expect(accountMetas).toStrictEqual([
            { address: 'writable-signer-1', role: AccountRole.WRITABLE_SIGNER },
            { address: 'writable-signer-2', role: AccountRole.WRITABLE_SIGNER },
            { address: 'readonly-signer', role: AccountRole.READONLY_SIGNER },
            { address: 'writable-non-signer-1', role: AccountRole.WRITABLE },
            { address: 'writable-non-signer-2', role: AccountRole.WRITABLE },
            { address: 'readonly-non-signer-1', role: AccountRole.READONLY },
            { address: 'readonly-non-signer-2', role: AccountRole.READONLY },
        ]);
    });

    it('should return account metas with only writable signers', () => {
        const compiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 2,
            },
            staticAccounts: ['writable-signer-1' as Address, 'writable-signer-2' as Address],
        } as CompiledTransactionMessage;

        const accountMetas = getAccountMetas(compiledTransactionMessage);

        expect(accountMetas).toStrictEqual([
            { address: 'writable-signer-1', role: AccountRole.WRITABLE_SIGNER },
            { address: 'writable-signer-2', role: AccountRole.WRITABLE_SIGNER },
        ]);
    });

    it('should return account metas with only readonly signers', () => {
        const compiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 2,
                numSignerAccounts: 2,
            },
            staticAccounts: ['readonly-signer-1' as Address, 'readonly-signer-2' as Address],
        } as CompiledTransactionMessage;

        const accountMetas = getAccountMetas(compiledTransactionMessage);

        expect(accountMetas).toStrictEqual([
            { address: 'readonly-signer-1', role: AccountRole.READONLY_SIGNER },
            { address: 'readonly-signer-2', role: AccountRole.READONLY_SIGNER },
        ]);
    });

    it('should return account metas with only writable non-signers', () => {
        const compiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 0,
            },
            staticAccounts: ['writable-non-signer-1' as Address, 'writable-non-signer-2' as Address],
        } as CompiledTransactionMessage;

        const accountMetas = getAccountMetas(compiledTransactionMessage);

        expect(accountMetas).toStrictEqual([
            { address: 'writable-non-signer-1', role: AccountRole.WRITABLE },
            { address: 'writable-non-signer-2', role: AccountRole.WRITABLE },
        ]);
    });

    it('should return account metas with only readonly non-signers', () => {
        const compiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 2,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 0,
            },
            staticAccounts: ['readonly-non-signer-1' as Address, 'readonly-non-signer-2' as Address],
        } as CompiledTransactionMessage;

        const accountMetas = getAccountMetas(compiledTransactionMessage);

        expect(accountMetas).toStrictEqual([
            { address: 'readonly-non-signer-1', role: AccountRole.READONLY },
            { address: 'readonly-non-signer-2', role: AccountRole.READONLY },
        ]);
    });

    it('should return empty array when no accounts are present', () => {
        const compiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 0,
            },
            staticAccounts: [] as Address[],
        } as CompiledTransactionMessage;

        const accountMetas = getAccountMetas(compiledTransactionMessage);

        expect(accountMetas).toStrictEqual([]);
    });

    it('should handle a single writable signer (fee payer only)', () => {
        const compiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 1,
            },
            staticAccounts: ['fee-payer' as Address],
        } as CompiledTransactionMessage;

        const accountMetas = getAccountMetas(compiledTransactionMessage);

        expect(accountMetas).toStrictEqual([{ address: 'fee-payer', role: AccountRole.WRITABLE_SIGNER }]);
    });

    it('should correctly handle mixed writable signers and readonly non-signers', () => {
        const compiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 2,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 2,
            },
            staticAccounts: [
                'writable-signer-1' as Address,
                'writable-signer-2' as Address,
                'readonly-non-signer-1' as Address,
                'readonly-non-signer-2' as Address,
            ],
        } as CompiledTransactionMessage;

        const accountMetas = getAccountMetas(compiledTransactionMessage);

        expect(accountMetas).toStrictEqual([
            { address: 'writable-signer-1', role: AccountRole.WRITABLE_SIGNER },
            { address: 'writable-signer-2', role: AccountRole.WRITABLE_SIGNER },
            { address: 'readonly-non-signer-1', role: AccountRole.READONLY },
            { address: 'readonly-non-signer-2', role: AccountRole.READONLY },
        ]);
    });
});
