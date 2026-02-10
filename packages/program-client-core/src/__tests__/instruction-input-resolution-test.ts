import '@solana/test-matchers/toBeFrozenObject';

import { type Address, address, ProgramDerivedAddressBump } from '@solana/addresses';
import {
    SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL,
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
} from '../instruction-input-resolution';

const mockAddress = address('FiRHXPUxuo42VfWp3vvPVb5he5zvhvMw6DzNigN7nEpe');
const mockPda = [mockAddress, 255 as ProgramDerivedAddressBump] as const;
const mockSigner = {
    address: mockAddress,
    signTransactions: () => Promise.resolve([]),
};

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

    it('returns undefined for null accounts with omitted strategy', () => {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'omitted');
        const meta = toAccountMeta('test', { isWritable: false, value: null });
        expect(meta).toBeUndefined();
    });

    it('returns program address for null accounts with programId strategy', () => {
        const programAddress = address('11111111111111111111111111111111') as Address;
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
        const programAddress = address('11111111111111111111111111111111') as Address;
        const toAccountMeta = getAccountMetaFactory(programAddress, 'programId');
        const meta = toAccountMeta('test', { isWritable: false, value: null });
        expect(meta).toBeFrozenObject();
    });
});
