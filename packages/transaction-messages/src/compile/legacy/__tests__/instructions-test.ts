import { Address } from '@solana/addresses';
import { AccountRole, Instruction } from '@solana/instructions';

import { OrderedAccounts } from '../accounts';
import { getAccountIndex, getCompiledInstructions } from '../instructions';

let _nextMockAddress = 0;
function getMockAddress() {
    return `${_nextMockAddress++}` as Address;
}

describe('getCompiledInstructions', () => {
    it('compiles no account indices when are no accounts', () => {
        const compiledInstructions = getCompiledInstructions(
            [{ programAddress: getMockAddress() }],
            [] as unknown as OrderedAccounts,
        );
        expect(compiledInstructions[0]).not.toHaveProperty('accountIndices');
    });
    it('compiles no data when there is no data', () => {
        const compiledInstructions = getCompiledInstructions(
            [{ programAddress: getMockAddress() }],
            [] as unknown as OrderedAccounts,
        );
        expect(compiledInstructions[0]).not.toHaveProperty('data');
    });
    it('compiles account addresses into indices of the account addresses', () => {
        const addressAtIndex2 = getMockAddress();
        const addressAtIndex3 = getMockAddress();
        const addressAtIndex4 = getMockAddress();
        const programAddressAtIndex1 = getMockAddress();
        const instructions = [
            {
                accounts: [
                    { address: addressAtIndex3, role: AccountRole.READONLY },
                    { address: addressAtIndex2, role: AccountRole.WRITABLE },
                ],
                programAddress: programAddressAtIndex1,
            },
            {
                accounts: [{ address: addressAtIndex4, role: AccountRole.READONLY }],
                programAddress: programAddressAtIndex1,
            },
        ] as Instruction[];
        const compiledInstructions = getCompiledInstructions(instructions, [
            { address: getMockAddress(), role: AccountRole.WRITABLE_SIGNER },
            { address: programAddressAtIndex1, role: AccountRole.READONLY },
            { address: addressAtIndex2, role: AccountRole.WRITABLE },
            { address: addressAtIndex3, role: AccountRole.READONLY },
            { address: addressAtIndex4, role: AccountRole.READONLY },
        ] as OrderedAccounts);
        expect(compiledInstructions).toHaveProperty('0.accountIndices', [3, 2]);
        expect(compiledInstructions).toHaveProperty('1.accountIndices', [4]);
    });
    it('copies over the instruction data verbatim', () => {
        const expectedData = new Uint8Array([1, 2, 3]);
        const compiledInstructions = getCompiledInstructions(
            [{ data: expectedData, programAddress: getMockAddress() }],
            [] as unknown as OrderedAccounts,
        );
        expect(compiledInstructions[0]).toHaveProperty('data', expectedData);
    });
    it('compiles the program address into a program address index', () => {
        const programAddress = getMockAddress();
        const compiledInstructions = getCompiledInstructions([{ programAddress }], [
            { address: getMockAddress(), role: AccountRole.WRITABLE_SIGNER },
            { address: programAddress, role: AccountRole.READONLY },
        ] as OrderedAccounts);
        expect(compiledInstructions[0]).toHaveProperty('programAddressIndex', 1);
    });
});

describe('getAccountIndex', () => {
    it('returns an empty object when given an empty array', () => {
        const accountIndex = getAccountIndex([] as unknown as OrderedAccounts);
        expect(accountIndex).toEqual({});
    });

    it('returns a mapping of addresses to their indices for a single account', () => {
        const address = getMockAddress();
        const accountIndex = getAccountIndex([{ address, role: AccountRole.WRITABLE_SIGNER }] as OrderedAccounts);
        expect(accountIndex).toEqual({ [address]: 0 });
    });

    it('returns a mapping of addresses to their indices for multiple accounts', () => {
        const address0 = getMockAddress();
        const address1 = getMockAddress();
        const address2 = getMockAddress();
        const address3 = getMockAddress();
        const accountIndex = getAccountIndex([
            { address: address0, role: AccountRole.WRITABLE_SIGNER },
            { address: address1, role: AccountRole.READONLY },
            { address: address2, role: AccountRole.WRITABLE },
            { address: address3, role: AccountRole.READONLY_SIGNER },
        ] as OrderedAccounts);
        expect(accountIndex).toEqual({
            [address0]: 0,
            [address1]: 1,
            [address2]: 2,
            [address3]: 3,
        });
    });

    it('uses the last occurrence when there are duplicate addresses', () => {
        const address = getMockAddress();
        const accountIndex = getAccountIndex([
            { address, role: AccountRole.READONLY },
            { address, role: AccountRole.WRITABLE_SIGNER },
        ] as OrderedAccounts);
        expect(accountIndex).toEqual({ [address]: 1 });
    });
});
