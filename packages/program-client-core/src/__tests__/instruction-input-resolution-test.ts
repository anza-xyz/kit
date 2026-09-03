import '@solana/test-matchers/toBeFrozenObject';

import { address, type HasAddress, ProgramDerivedAddressBump } from '@solana/addresses';
import {
    SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL,
    SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_SIGNER,
    SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE,
    SolanaError,
} from '@solana/errors';
import { AccountRole } from '@solana/instructions';

import {
    getAccountMetaFactory,
    getAddressFromResolvedInstructionAccount,
    getNonNullResolvedInstructionInput,
    getResolvedInstructionAccountAsProgramDerivedAddress,
    getResolvedInstructionAccountAsTransactionSigner,
    type InstructionAccountInput,
    type InstructionSignerInput,
    type ResolvedInstructionAccount,
} from '../instruction-input-resolution';

const mockAddress = address('FiRHXPUxuo42VfWp3vvPVb5he5zvhvMw6DzNigN7nEpe');
const mockPda = [mockAddress, 255 as ProgramDerivedAddressBump] as const;
const mockSigner = {
    address: mockAddress,
    signTransactions: () => Promise.resolve([]),
};
const mockAddressWrapper = { address: mockAddress };

describe('getNonNullResolvedInstructionInput', () => {
    it('returns the value as-is when it is not null or undefined', () => {
        expect(getNonNullResolvedInstructionInput('test', 'hello')).toBe('hello');
        expect(getNonNullResolvedInstructionInput('test', 42)).toBe(42);
        expect(getNonNullResolvedInstructionInput('test', mockAddress)).toBe(mockAddress);
    });

    it('throws when the value is null or undefined', () => {
        expect(() => getNonNullResolvedInstructionInput('myInput', null)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL, {
                inputName: 'myInput',
            }),
        );
        expect(() => getNonNullResolvedInstructionInput('myInput', undefined)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL, {
                inputName: 'myInput',
            }),
        );
    });
});

describe('getAddressFromResolvedInstructionAccount', () => {
    it('returns the address when given an Address', () => {
        expect(getAddressFromResolvedInstructionAccount('test', mockAddress)).toBe(mockAddress);
    });

    it('extracts the address from a ProgramDerivedAddress', () => {
        expect(getAddressFromResolvedInstructionAccount('test', mockPda)).toBe(mockAddress);
    });

    it('extracts the address from a TransactionSigner', () => {
        expect(getAddressFromResolvedInstructionAccount('test', mockSigner)).toBe(mockAddress);
    });

    it('extracts the address from any object exposing an address property', () => {
        expect(getAddressFromResolvedInstructionAccount('test', mockAddressWrapper)).toBe(mockAddress);
    });

    it('extracts the address from an account meta', () => {
        expect(
            getAddressFromResolvedInstructionAccount('test', { address: mockAddress, role: AccountRole.WRITABLE }),
        ).toBe(mockAddress);
    });

    it('throws when the value is null or undefined', () => {
        expect(() => getAddressFromResolvedInstructionAccount('myInput', null)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL, {
                inputName: 'myInput',
            }),
        );
        expect(() => getAddressFromResolvedInstructionAccount('myInput', undefined)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL, {
                inputName: 'myInput',
            }),
        );
    });
});

describe('getResolvedInstructionAccountAsProgramDerivedAddress', () => {
    it('returns the PDA when given a ProgramDerivedAddress', () => {
        expect(getResolvedInstructionAccountAsProgramDerivedAddress('test', mockPda)).toBe(mockPda);
    });

    it('throws when the value is not a PDA', () => {
        expect(() => getResolvedInstructionAccountAsProgramDerivedAddress('myInput', mockAddress)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
                expectedType: 'ProgramDerivedAddress',
                inputName: 'myInput',
            }),
        );
        expect(() => getResolvedInstructionAccountAsProgramDerivedAddress('myInput', mockSigner)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
                expectedType: 'ProgramDerivedAddress',
                inputName: 'myInput',
            }),
        );
    });

    it('throws when the value is null or undefined', () => {
        expect(() => getResolvedInstructionAccountAsProgramDerivedAddress('myInput', null)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
                expectedType: 'ProgramDerivedAddress',
                inputName: 'myInput',
            }),
        );
        expect(() => getResolvedInstructionAccountAsProgramDerivedAddress('myInput', undefined)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
                expectedType: 'ProgramDerivedAddress',
                inputName: 'myInput',
            }),
        );
    });
});

describe('getResolvedInstructionAccountAsTransactionSigner', () => {
    it('returns the signer when given a TransactionSigner', () => {
        expect(getResolvedInstructionAccountAsTransactionSigner('test', mockSigner)).toBe(mockSigner);
    });

    it('extracts the signer from an AccountSignerMeta', () => {
        const meta = { address: mockAddress, role: AccountRole.READONLY_SIGNER, signer: mockSigner } as const;
        expect(getResolvedInstructionAccountAsTransactionSigner('test', meta)).toBe(mockSigner);
    });

    it('returns signers with an incidental signer property as-is', () => {
        // Only values carrying an explicit numeric role — i.e. account metas — have their
        // `signer` property unwrapped, consistently with `getAccountMetaFactory`.
        const wrapperSigner = { ...mockSigner, signer: mockSigner };
        expect(getResolvedInstructionAccountAsTransactionSigner('test', wrapperSigner)).toBe(wrapperSigner);
    });

    it('throws when given an account meta with no signer attached', () => {
        expect(() =>
            getResolvedInstructionAccountAsTransactionSigner('myInput', {
                address: mockAddress,
                role: AccountRole.READONLY,
            }),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
                expectedType: 'TransactionSigner',
                inputName: 'myInput',
            }),
        );
    });

    it('throws when the value is not a TransactionSigner', () => {
        expect(() => getResolvedInstructionAccountAsTransactionSigner('myInput', mockAddress)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
                expectedType: 'TransactionSigner',
                inputName: 'myInput',
            }),
        );
        expect(() => getResolvedInstructionAccountAsTransactionSigner('myInput', mockPda)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
                expectedType: 'TransactionSigner',
                inputName: 'myInput',
            }),
        );
    });

    it('throws when the value is null or undefined', () => {
        expect(() => getResolvedInstructionAccountAsTransactionSigner('myInput', null)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
                expectedType: 'TransactionSigner',
                inputName: 'myInput',
            }),
        );
        expect(() => getResolvedInstructionAccountAsTransactionSigner('myInput', undefined)).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
                expectedType: 'TransactionSigner',
                inputName: 'myInput',
            }),
        );
    });
});

describe('getAccountMetaFactory', () => {
    it('creates account meta for an Address with the correct role', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');

        const readonlyMeta = toAccountMeta('test', { isWritable: false, value: mockAddress });
        expect(readonlyMeta).toEqual({ address: mockAddress, role: AccountRole.READONLY });

        const writableMeta = toAccountMeta('test', { isWritable: true, value: mockAddress });
        expect(writableMeta).toEqual({ address: mockAddress, role: AccountRole.WRITABLE });
    });

    it('creates account meta for a TransactionSigner with the signer role', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');

        const readonlySignerMeta = toAccountMeta('test', { isWritable: false, value: mockSigner });
        expect(readonlySignerMeta).toEqual({
            address: mockAddress,
            role: AccountRole.READONLY_SIGNER,
            signer: mockSigner,
        });

        const writableSignerMeta = toAccountMeta('test', { isWritable: true, value: mockSigner });
        expect(writableSignerMeta).toEqual({
            address: mockAddress,
            role: AccountRole.WRITABLE_SIGNER,
            signer: mockSigner,
        });
    });

    it('extracts the address from a PDA', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const meta = toAccountMeta('test', { isWritable: false, value: mockPda });
        expect(meta).toEqual({ address: mockAddress, role: AccountRole.READONLY });
    });

    it('extracts the address from any object exposing an address property', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const meta = toAccountMeta('test', { isWritable: true, value: mockAddressWrapper });
        expect(meta).toEqual({ address: mockAddress, role: AccountRole.WRITABLE });
    });

    it('honours the explicit role of a provided account meta over the IDL flags', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const meta = toAccountMeta('test', {
            isSigner: false,
            isWritable: true,
            value: { address: mockAddress, role: AccountRole.READONLY },
        });
        expect(meta).toEqual({ address: mockAddress, role: AccountRole.READONLY });
    });

    it('honours the explicit role and signer of a provided account signer meta over the IDL flags', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const meta = toAccountMeta('test', {
            isSigner: true,
            isWritable: false,
            value: { address: mockAddress, role: AccountRole.WRITABLE_SIGNER, signer: mockSigner },
        });
        expect(meta).toEqual({ address: mockAddress, role: AccountRole.WRITABLE_SIGNER, signer: mockSigner });
    });

    it('honours explicit roles that contradict the IDL signer flag', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');

        // Demoting a signer account to a non-signer role.
        const demotedMeta = toAccountMeta('test', {
            isSigner: true,
            isWritable: true,
            value: { address: mockAddress, role: AccountRole.READONLY },
        });
        expect(demotedMeta).toEqual({ address: mockAddress, role: AccountRole.READONLY });

        // Promoting a non-signer account to a signer role.
        const promotedMeta = toAccountMeta('test', {
            isSigner: false,
            isWritable: false,
            value: { address: mockAddress, role: AccountRole.READONLY_SIGNER, signer: mockSigner },
        });
        expect(promotedMeta).toEqual({ address: mockAddress, role: AccountRole.READONLY_SIGNER, signer: mockSigner });
    });

    it('ignores non-numeric role properties on address-bearing objects', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const value = { address: mockAddress, role: 'admin' } as HasAddress;
        const meta = toAccountMeta('test', { isSigner: false, isWritable: true, value });
        expect(meta).toEqual({ address: mockAddress, role: AccountRole.WRITABLE });
    });

    it('treats signers as plain address carriers when the IDL declares the account as a non-signer', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const meta = toAccountMeta('test', { isSigner: false, isWritable: true, value: mockSigner });
        expect(meta).toEqual({ address: mockAddress, role: AccountRole.WRITABLE });
    });

    it('upgrades the role of provided signers when the IDL lets the input decide', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');

        const signerMeta = toAccountMeta('test', { isSigner: 'either', isWritable: false, value: mockSigner });
        expect(signerMeta).toEqual({ address: mockAddress, role: AccountRole.READONLY_SIGNER, signer: mockSigner });

        const addressMeta = toAccountMeta('test', { isSigner: 'either', isWritable: false, value: mockAddress });
        expect(addressMeta).toEqual({ address: mockAddress, role: AccountRole.READONLY });
    });

    it('upgrades the role of provided signers when the IDL declares the account as a signer', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const meta = toAccountMeta('test', { isSigner: true, isWritable: true, value: mockSigner });
        expect(meta).toEqual({ address: mockAddress, role: AccountRole.WRITABLE_SIGNER, signer: mockSigner });
    });

    it('throws when the IDL declares the account as a signer but no signer is provided', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const expectedError = new SolanaError(
            SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_SIGNER,
            {
                inputName: 'myInput',
            },
        );
        expect(() => toAccountMeta('myInput', { isSigner: true, isWritable: false, value: mockAddress })).toThrow(
            expectedError,
        );
        expect(() =>
            toAccountMeta('myInput', { isSigner: true, isWritable: false, value: mockAddressWrapper }),
        ).toThrow(expectedError);
        expect(() => toAccountMeta('myInput', { isSigner: true, isWritable: false, value: mockPda })).toThrow(
            expectedError,
        );
    });

    it('freezes the returned meta object when an explicit role is provided', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const meta = toAccountMeta('test', {
            isWritable: true,
            value: { address: mockAddress, role: AccountRole.READONLY },
        });
        expect(meta).toBeFrozenObject();
    });

    it('returns undefined for null accounts with omitted strategy', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'omitted');
        const meta = toAccountMeta('test', { isWritable: false, value: null });
        expect(meta).toBeUndefined();
    });

    it('returns program address for null accounts with programId strategy', () => {
        const programAddress = address('11111111111111111111111111111111');
        const toAccountMeta = getAccountMetaFactory(programAddress, 'programId');
        const meta = toAccountMeta('test', { isWritable: false, value: null });
        expect(meta).toEqual({ address: programAddress, role: AccountRole.READONLY });
    });

    it('freezes the returned meta object', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const meta = toAccountMeta('test', { isWritable: false, value: mockAddress });
        expect(meta).toBeFrozenObject();
    });

    it('freezes the returned meta object when using the program address as null', () => {
        const programAddress = address('11111111111111111111111111111111');
        const toAccountMeta = getAccountMetaFactory(programAddress, 'programId');
        const meta = toAccountMeta('test', { isWritable: false, value: null });
        expect(meta).toBeFrozenObject();
    });
});

describe('generated program client integration', () => {
    // The following replicates the body of a generated instruction builder — including the
    // `originalAccounts` literal, the `Record` cast and the account meta factory loop — to
    // validate the runtime behaviour the Codama JS renderer will rely on.
    const programAddress = address('DDCceVpzdRsKEGaLkKKAoNqj8PGRxJpBB4Nc3TPCK1Tk');
    const payerAddress = address('Ex1bDfnPYcSNsFvvZAvnFgTXWTPTBJCkQxNSFGaGtZmT');
    const ownerAddress = address('9r5RGhVXjcs4dRdvMGZJEtzcnQfMvVzf2VuNsm12kFPR');
    const mintAddress = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    const payerSigner = { address: payerAddress, signTransactions: () => Promise.resolve([]) };
    const ownerSigner = { address: ownerAddress, signTransactions: () => Promise.resolve([]) };
    const mintSigner = { address: mintAddress, signTransactions: () => Promise.resolve([]) };

    type MockInput = {
        mint?: InstructionAccountInput | null;
        owner: InstructionAccountInput | InstructionSignerInput;
        payer: InstructionSignerInput;
    };
    function getMockInstruction(input: MockInput) {
        const originalAccounts = {
            mint: { isSigner: false, isWritable: true, value: input.mint ?? null },
            owner: { isSigner: 'either', isWritable: false, value: input.owner ?? null },
            payer: { isSigner: true, isWritable: true, value: input.payer ?? null },
        };
        const accounts = originalAccounts as Record<keyof typeof originalAccounts, ResolvedInstructionAccount>;
        const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
        return Object.freeze({
            accounts: [
                getAccountMeta('payer', accounts.payer),
                getAccountMeta('owner', accounts.owner),
                getAccountMeta('mint', accounts.mint),
            ],
            data: new Uint8Array([42]),
            programAddress,
        });
    }

    it('builds IDL-declared metas from plain values', () => {
        const instruction = getMockInstruction({ mint: mintAddress, owner: ownerAddress, payer: payerSigner });
        expect(instruction.accounts).toEqual([
            { address: payerAddress, role: AccountRole.WRITABLE_SIGNER, signer: payerSigner },
            { address: ownerAddress, role: AccountRole.READONLY },
            { address: mintAddress, role: AccountRole.WRITABLE },
        ]);
    });

    it('upgrades optional signer accounts when a signer is provided', () => {
        const instruction = getMockInstruction({ mint: mintAddress, owner: ownerSigner, payer: payerSigner });
        expect(instruction.accounts[1]).toEqual({
            address: ownerAddress,
            role: AccountRole.READONLY_SIGNER,
            signer: ownerSigner,
        });
    });

    it('treats signers provided for non-signer accounts as plain address carriers', () => {
        const instruction = getMockInstruction({ mint: mintSigner, owner: ownerAddress, payer: payerSigner });
        expect(instruction.accounts[2]).toEqual({ address: mintAddress, role: AccountRole.WRITABLE });
    });

    it('honours explicit role overrides', () => {
        const instruction = getMockInstruction({
            mint: { address: mintAddress, role: AccountRole.READONLY },
            owner: { address: ownerAddress, role: AccountRole.WRITABLE_SIGNER, signer: ownerSigner },
            payer: { address: payerAddress, role: AccountRole.READONLY_SIGNER, signer: payerSigner },
        });
        expect(instruction.accounts).toEqual([
            { address: payerAddress, role: AccountRole.READONLY_SIGNER, signer: payerSigner },
            { address: ownerAddress, role: AccountRole.WRITABLE_SIGNER, signer: ownerSigner },
            { address: mintAddress, role: AccountRole.READONLY },
        ]);
    });

    it('resolves optional accounts using the programId strategy', () => {
        const instruction = getMockInstruction({ owner: ownerAddress, payer: payerSigner });
        expect(instruction.accounts[2]).toEqual({ address: programAddress, role: AccountRole.READONLY });
    });

    it('throws when a required signer account receives a non-signer value', () => {
        expect(() =>
            getMockInstruction({
                mint: mintAddress,
                owner: ownerAddress,
                payer: payerAddress as unknown as InstructionSignerInput,
            }),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_SIGNER, {
                inputName: 'payer',
            }),
        );
    });
});
