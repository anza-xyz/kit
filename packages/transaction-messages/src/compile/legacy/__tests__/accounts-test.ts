import { Address, getAddressComparator } from '@solana/addresses';
import { AccountRole, Instruction } from '@solana/instructions';

import {
    ADDRESS_MAP_TYPE_PROPERTY as TYPE,
    AddressMapEntryType,
    getAddressMapFromInstructions,
    getOrderedAccountsFromAddressMap,
} from '../accounts';

type AccountRoleEnumName = keyof typeof AccountRole;
type TestCase = {
    aRole: AccountRoleEnumName;
    bRole: AccountRoleEnumName;
    expectedEntry:
        | typeof FEE_PAYER_ENTRY
        | typeof STATIC_ENTRY_READONLY
        | typeof STATIC_ENTRY_READONLY_SIGNER
        | typeof STATIC_ENTRY_WRITABLE
        | typeof STATIC_ENTRY_WRITABLE_SIGNER;
    instructionOrder: [string, (i: Instruction[]) => Instruction[]];
    role: AccountRoleEnumName;
    staticRole: AccountRoleEnumName;
};

const MOCK_ADDRESSES: ReadonlyArray<Address> = [
    'BRwZRKsvKkG45g59269qZ5e8UaECFim5Qfxex44UKwDG',
    'AZE3mXbzNp8SfZYBfL4L67ejQ8zmatAKKezUdCarKnUL',
    'Awft9caFzun5FcVTaXJAkAYDBgbEDF5QALeaqeY3M3Va',
    'ARc8zz6T14LZQTpjryhBGDuNZb3YmNT9PtEuBSuVM5xo',
    '6Tu9wk1r9yGwzd3xdrVzDttmkTN98iiffq7L25JKTvwh',
    '4R6dgeBbwPjnTSN78KGxhB78oFsxaobiwBsCBLAyauqA',
] as Address[];

let _nextMockAddress = 0;
function getMockAddress() {
    return `${_nextMockAddress++}` as Address;
}
function forwardOrder(i: Instruction[]) {
    return i;
}
function reverseOrder(i: Instruction[]) {
    return i.reverse();
}

const FEE_PAYER_ENTRY = { [TYPE]: AddressMapEntryType.FEE_PAYER, role: AccountRole.WRITABLE_SIGNER } as const;
const STATIC_ENTRY_READONLY = { [TYPE]: AddressMapEntryType.STATIC, role: AccountRole.READONLY } as const;
const STATIC_ENTRY_READONLY_SIGNER = { [TYPE]: AddressMapEntryType.STATIC, role: AccountRole.READONLY_SIGNER } as const;
const STATIC_ENTRY_WRITABLE = { [TYPE]: AddressMapEntryType.STATIC, role: AccountRole.WRITABLE } as const;
const STATIC_ENTRY_WRITABLE_SIGNER = { [TYPE]: AddressMapEntryType.STATIC, role: AccountRole.WRITABLE_SIGNER } as const;

describe('getAddressMapFromInstructions', () => {
    it('creates a fee-payer entry for the fee payer', () => {
        const feePayerAddress = getMockAddress();
        const addressMap = getAddressMapFromInstructions(feePayerAddress, []);
        expect(addressMap).toHaveProperty(feePayerAddress, FEE_PAYER_ENTRY);
    });
    it('creates a READONLY static entry for a program address', () => {
        const programAddress = getMockAddress();
        const addressMap = getAddressMapFromInstructions(/* fee payer */ getMockAddress(), [{ programAddress }]);
        expect(addressMap).toHaveProperty(programAddress, STATIC_ENTRY_READONLY);
    });
    it('creates a READONLY static entry for a static account address', () => {
        const staticAccountAddress = getMockAddress();
        const addressMap = getAddressMapFromInstructions(/* fee payer */ getMockAddress(), [
            {
                accounts: [{ address: staticAccountAddress, role: AccountRole.READONLY }],
                programAddress: getMockAddress(),
            },
        ]);
        expect(addressMap).toHaveProperty(staticAccountAddress, STATIC_ENTRY_READONLY);
    });
    it.each`
        role                 | expectedEntry
        ${'READONLY'}        | ${STATIC_ENTRY_READONLY}
        ${'WRITABLE'}        | ${STATIC_ENTRY_WRITABLE}
        ${'READONLY_SIGNER'} | ${STATIC_ENTRY_READONLY_SIGNER}
        ${'WRITABLE_SIGNER'} | ${STATIC_ENTRY_WRITABLE_SIGNER}
    `('creates a $role static entry for a $role static account address', ({ expectedEntry, role }: TestCase) => {
        const staticAccountAddress = getMockAddress();
        const addressMap = getAddressMapFromInstructions(/* fee payer */ getMockAddress(), [
            {
                accounts: [{ address: staticAccountAddress, role: AccountRole[role] }],
                programAddress: getMockAddress(),
            },
        ]);
        expect(addressMap).toHaveProperty(staticAccountAddress, expectedEntry);
    });
    it('fatals given a matching fee payer and program address', () => {
        const commonAddress = getMockAddress();
        expect(() => {
            getAddressMapFromInstructions(/* fee payer */ commonAddress, [{ programAddress: commonAddress }]);
        }).toThrow();
    });
    it.each(['READONLY', 'WRITABLE', 'READONLY_SIGNER', 'WRITABLE_SIGNER'] as AccountRoleEnumName[])(
        'creates a fee-payer entry given a matching fee payer and %s static account address',
        role => {
            const commonAddress = getMockAddress();
            const addressMap = getAddressMapFromInstructions(/* fee payer */ commonAddress, [
                {
                    accounts: [{ address: commonAddress, role: AccountRole[role] }],
                    programAddress: getMockAddress(),
                },
            ]);
            expect(addressMap).toHaveProperty(commonAddress, FEE_PAYER_ENTRY);
        },
    );
    it('creates one READONLY static entry given two matching program addresses', () => {
        const commonAddress = getMockAddress();
        const addressMap = getAddressMapFromInstructions(/* fee payer */ getMockAddress(), [
            { programAddress: commonAddress },
            { programAddress: commonAddress },
        ]);
        expect(addressMap).toHaveProperty(commonAddress, STATIC_ENTRY_READONLY);
    });
    it.each`
        role                 | instructionOrder
        ${'READONLY'}        | ${['static address comes first', forwardOrder]}
        ${'READONLY_SIGNER'} | ${['static address comes first', forwardOrder]}
        ${'READONLY'}        | ${['program address comes first', reverseOrder]}
        ${'READONLY_SIGNER'} | ${['program address comes first', reverseOrder]}
    `(
        'creates a $role static entry given a matching program and $role static account address when the $instructionOrder.0',
        ({ instructionOrder: [_, orderInstructions], role }: TestCase) => {
            const commonAddress = getMockAddress();
            const addressMap = getAddressMapFromInstructions(
                /* fee payer */ getMockAddress(),
                orderInstructions([
                    {
                        accounts: [{ address: commonAddress, role: AccountRole[role] }],
                        programAddress: getMockAddress(),
                    },
                    {
                        programAddress: commonAddress,
                    },
                ]),
            );
            expect(addressMap).toHaveProperty(commonAddress, {
                [TYPE]: AddressMapEntryType.STATIC,
                role: AccountRole[role],
            });
        },
    );
    it.each`
        role                 | instructionOrder
        ${'WRITABLE'}        | ${['static address comes first', forwardOrder]}
        ${'WRITABLE_SIGNER'} | ${['static address comes first', forwardOrder]}
        ${'WRITABLE'}        | ${['program address comes first', reverseOrder]}
        ${'WRITABLE_SIGNER'} | ${['program address comes first', reverseOrder]}
    `(
        'fatals given a matching program and $role static account address when the $instructionOrder.0',
        ({ instructionOrder: [_, orderInstructions], role }: TestCase) => {
            const commonAddress = getMockAddress();
            expect(() =>
                getAddressMapFromInstructions(
                    /* fee payer */ getMockAddress(),
                    orderInstructions([
                        {
                            accounts: [{ address: commonAddress, role: AccountRole[role] }],
                            programAddress: getMockAddress(),
                        },
                        { programAddress: commonAddress },
                    ]),
                ),
            ).toThrow();
        },
    );
    it.each`
        aRole                | bRole                | endRole              | expectedEntry
        ${'READONLY'}        | ${'READONLY'}        | ${'READONLY'}        | ${STATIC_ENTRY_READONLY}
        ${'READONLY'}        | ${'WRITABLE'}        | ${'WRITABLE'}        | ${STATIC_ENTRY_WRITABLE}
        ${'READONLY'}        | ${'READONLY_SIGNER'} | ${'READONLY_SIGNER'} | ${STATIC_ENTRY_READONLY_SIGNER}
        ${'READONLY'}        | ${'WRITABLE_SIGNER'} | ${'WRITABLE_SIGNER'} | ${STATIC_ENTRY_WRITABLE_SIGNER}
        ${'WRITABLE'}        | ${'READONLY'}        | ${'WRITABLE'}        | ${STATIC_ENTRY_WRITABLE}
        ${'WRITABLE'}        | ${'WRITABLE'}        | ${'WRITABLE'}        | ${STATIC_ENTRY_WRITABLE}
        ${'WRITABLE'}        | ${'READONLY_SIGNER'} | ${'WRITABLE_SIGNER'} | ${STATIC_ENTRY_WRITABLE_SIGNER}
        ${'WRITABLE'}        | ${'WRITABLE_SIGNER'} | ${'WRITABLE_SIGNER'} | ${STATIC_ENTRY_WRITABLE_SIGNER}
        ${'READONLY_SIGNER'} | ${'READONLY'}        | ${'READONLY_SIGNER'} | ${STATIC_ENTRY_READONLY_SIGNER}
        ${'READONLY_SIGNER'} | ${'WRITABLE'}        | ${'WRITABLE_SIGNER'} | ${STATIC_ENTRY_WRITABLE_SIGNER}
        ${'READONLY_SIGNER'} | ${'READONLY_SIGNER'} | ${'READONLY_SIGNER'} | ${STATIC_ENTRY_READONLY_SIGNER}
        ${'READONLY_SIGNER'} | ${'WRITABLE_SIGNER'} | ${'WRITABLE_SIGNER'} | ${STATIC_ENTRY_WRITABLE_SIGNER}
        ${'WRITABLE_SIGNER'} | ${'READONLY'}        | ${'WRITABLE_SIGNER'} | ${STATIC_ENTRY_WRITABLE_SIGNER}
        ${'WRITABLE_SIGNER'} | ${'WRITABLE'}        | ${'WRITABLE_SIGNER'} | ${STATIC_ENTRY_WRITABLE_SIGNER}
        ${'WRITABLE_SIGNER'} | ${'READONLY_SIGNER'} | ${'WRITABLE_SIGNER'} | ${STATIC_ENTRY_WRITABLE_SIGNER}
        ${'WRITABLE_SIGNER'} | ${'WRITABLE_SIGNER'} | ${'WRITABLE_SIGNER'} | ${STATIC_ENTRY_WRITABLE_SIGNER}
    `(
        'creates one $endRole static entry given matching $aRole and $bRole static accounts',
        ({ aRole, bRole, expectedEntry }: TestCase) => {
            const commonAddress = getMockAddress();
            const addressMap = getAddressMapFromInstructions(/* fee payer */ getMockAddress(), [
                {
                    accounts: [{ address: commonAddress, role: AccountRole[aRole] }],
                    programAddress: getMockAddress(),
                },
                {
                    accounts: [{ address: commonAddress, role: AccountRole[bRole] }],
                    programAddress: getMockAddress(),
                },
            ]);
            expect(addressMap).toHaveProperty(commonAddress, expectedEntry);
        },
    );
});

describe('getOrderedAccountsFromAddressMap', () => {
    let sortedAddresses: Address[];
    beforeEach(() => {
        sortedAddresses = [...MOCK_ADDRESSES].sort(getAddressComparator());
    });
    it.each(['READONLY', 'WRITABLE', 'READONLY_SIGNER', 'WRITABLE_SIGNER'] as AccountRoleEnumName[])(
        'puts the fee payer before %s static addresses',
        role => {
            const orderedAccounts = getOrderedAccountsFromAddressMap({
                [sortedAddresses[0]]: { [TYPE]: AddressMapEntryType.STATIC, role: AccountRole[role] },
                [sortedAddresses[1]]: { [TYPE]: AddressMapEntryType.FEE_PAYER, role: AccountRole.WRITABLE_SIGNER },
            });
            expect(orderedAccounts).toHaveProperty('0', {
                [TYPE]: AddressMapEntryType.FEE_PAYER,
                address: sortedAddresses[1],
                role: AccountRole.WRITABLE_SIGNER,
            });
        },
    );
    it.each(['READONLY', 'WRITABLE', 'READONLY_SIGNER', 'WRITABLE_SIGNER'] as AccountRoleEnumName[])(
        'orders %s static account addresses in lexical order',
        role => {
            const roleMeta = { role: AccountRole[role] };
            const orderedAccounts = getOrderedAccountsFromAddressMap({
                [sortedAddresses[1]]: { [TYPE]: AddressMapEntryType.STATIC, ...roleMeta },
                [sortedAddresses[0]]: { [TYPE]: AddressMapEntryType.STATIC, ...roleMeta },
            });
            expect(orderedAccounts).toEqual([
                { [TYPE]: AddressMapEntryType.STATIC, address: sortedAddresses[0], ...roleMeta },
                { [TYPE]: AddressMapEntryType.STATIC, address: sortedAddresses[1], ...roleMeta },
            ]);
        },
    );
    it.each`
        beforeKind                  | beforeEntry                     | afterKind                   | afterEntry
        ${'WRITABLE static'}        | ${STATIC_ENTRY_WRITABLE}        | ${'READONLY static'}        | ${STATIC_ENTRY_READONLY}
        ${'READONLY_SIGNER static'} | ${STATIC_ENTRY_READONLY_SIGNER} | ${'READONLY static'}        | ${STATIC_ENTRY_READONLY}
        ${'READONLY_SIGNER static'} | ${STATIC_ENTRY_READONLY_SIGNER} | ${'WRITABLE static'}        | ${STATIC_ENTRY_WRITABLE}
        ${'WRITABLE_SIGNER static'} | ${STATIC_ENTRY_WRITABLE_SIGNER} | ${'READONLY static'}        | ${STATIC_ENTRY_READONLY}
        ${'WRITABLE_SIGNER static'} | ${STATIC_ENTRY_WRITABLE_SIGNER} | ${'WRITABLE static'}        | ${STATIC_ENTRY_WRITABLE}
        ${'WRITABLE_SIGNER static'} | ${STATIC_ENTRY_WRITABLE_SIGNER} | ${'READONLY_SIGNER static'} | ${STATIC_ENTRY_READONLY_SIGNER}
    `('orders $beforeKind addresses before $afterKind addresses', ({ afterEntry, beforeEntry }) => {
        const orderedAccounts = getOrderedAccountsFromAddressMap({
            [sortedAddresses[0]]: afterEntry,
            [sortedAddresses[1]]: beforeEntry,
        });
        expect(orderedAccounts).toEqual([
            { address: sortedAddresses[1], ...beforeEntry },
            { address: sortedAddresses[0], ...afterEntry },
        ]);
    });
});
