import { Address } from '@solana/addresses';

import { TransactionMessageWithBlockhashLifetime } from '../../../blockhash';
import { TransactionMessageWithFeePayer } from '../../../fee-payer';
import { TransactionMessageWithLifetime } from '../../../lifetime';
import { TransactionMessage } from '../../../transaction-message';
import { getCompiledMessageHeader } from '../../legacy/header';
import { getCompiledLifetimeToken } from '../../legacy/lifetime-token';
import { getCompiledAddressTableLookups } from '../../v0/address-table-lookups';
import { getCompiledInstructions } from '../../v0/instructions';
import { getCompiledStaticAccounts } from '../../v0/static-accounts';
import { compileTransactionMessage } from '../message';

jest.mock('../address-table-lookups');
jest.mock('../../legacy/header');
jest.mock('../instructions');
jest.mock('../../legacy/lifetime-token');
jest.mock('../static-accounts');

const MOCK_LIFETIME_CONSTRAINT =
    'SOME_CONSTRAINT' as unknown as TransactionMessageWithBlockhashLifetime['lifetimeConstraint'];

describe('compileTransactionMessage', () => {
    let baseTx: TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime;
    beforeEach(() => {
        baseTx = {
            feePayer: { address: 'abc' as Address<'abc'> },
            instructions: [],
            lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
            version: 0,
        };
    });
    describe('address table lookups', () => {
        const expectedAddressTableLookups = [] as ReturnType<typeof getCompiledAddressTableLookups>;
        beforeEach(() => {
            jest.mocked(getCompiledAddressTableLookups).mockReturnValue(expectedAddressTableLookups);
        });
        it('sets `addressTableLookups` to the return value of `getCompiledAddressTableLookups`', () => {
            const message = compileTransactionMessage(baseTx as typeof baseTx & { version: 0 });
            expect(getCompiledAddressTableLookups).toHaveBeenCalled();
            expect(message.addressTableLookups).toBe(expectedAddressTableLookups);
        });
    });
    describe('message header', () => {
        const expectedCompiledMessageHeader = {
            numReadonlyNonSignerAccounts: 0,
            numReadonlySignerAccounts: 0,
            numSignerAccounts: 1,
        } as const;
        beforeEach(() => {
            jest.mocked(getCompiledMessageHeader).mockReturnValue(expectedCompiledMessageHeader);
        });
        it('sets `header` to the return value of `getCompiledMessageHeader`', () => {
            const message = compileTransactionMessage(baseTx);
            expect(getCompiledMessageHeader).toHaveBeenCalled();
            expect(message.header).toBe(expectedCompiledMessageHeader);
        });
    });
    describe('instructions', () => {
        const expectedInstructions = [] as ReturnType<typeof getCompiledInstructions>;
        beforeEach(() => {
            jest.mocked(getCompiledInstructions).mockReturnValue(expectedInstructions);
        });
        it('sets `instructions` to the return value of `getCompiledInstructions`', () => {
            const message = compileTransactionMessage(baseTx);
            console.log({ message });
            expect(getCompiledInstructions).toHaveBeenCalledWith(
                baseTx.instructions,
                expect.any(Array) /* orderedAccounts */,
            );
            expect(message.instructions).toBe(expectedInstructions);
        });
    });
    describe('lifetime constraints', () => {
        beforeEach(() => {
            jest.mocked(getCompiledLifetimeToken).mockReturnValue('abc');
        });
        it('sets `lifetimeToken` to the return value of `getCompiledLifetimeToken`', () => {
            const message = compileTransactionMessage(baseTx);
            expect(getCompiledLifetimeToken).toHaveBeenCalledWith('SOME_CONSTRAINT');
            expect(message.lifetimeToken).toBe('abc');
        });
    });
    describe('static accounts', () => {
        const expectedStaticAccounts = [] as ReturnType<typeof getCompiledStaticAccounts>;
        beforeEach(() => {
            jest.mocked(getCompiledStaticAccounts).mockReturnValue(expectedStaticAccounts);
        });
        it('sets `staticAccounts` to the return value of `getCompiledStaticAccounts`', () => {
            const message = compileTransactionMessage(baseTx);
            expect(getCompiledStaticAccounts).toHaveBeenCalled();
            expect(message.staticAccounts).toBe(expectedStaticAccounts);
        });
    });
    describe('versions', () => {
        it('compiles the version', () => {
            const message = compileTransactionMessage(baseTx);
            expect(message).toHaveProperty('version', 0);
        });
    });
});
