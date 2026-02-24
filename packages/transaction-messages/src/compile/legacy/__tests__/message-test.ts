import { Address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';

import { TransactionMessageWithBlockhashLifetime } from '../../../blockhash';
import { TransactionMessageWithFeePayer } from '../../../fee-payer';
import { TransactionMessageWithLifetime } from '../../../lifetime';
import { TransactionMessage } from '../../../transaction-message';
import { getOrderedAccountsFromAddressMap, OrderedAccounts } from '../accounts';
import { getCompiledMessageHeader } from '../header';
import { getCompiledInstructions } from '../instructions';
import { getCompiledLifetimeToken } from '../lifetime-token';
import { compileTransactionMessage } from '../message';

jest.mock('../accounts');
jest.mock('../header');
jest.mock('../instructions');
jest.mock('../lifetime-token');

const MOCK_LIFETIME_CONSTRAINT =
    'SOME_CONSTRAINT' as unknown as TransactionMessageWithBlockhashLifetime['lifetimeConstraint'];

describe('compileTransactionMessage', () => {
    let baseTx: TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithLifetime & { version: 'legacy' };
    beforeEach(() => {
        baseTx = {
            feePayer: { address: 'abc' as Address<'abc'> },
            instructions: [],
            lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
            version: 'legacy',
        };
        jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue([] as unknown as OrderedAccounts);
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
        const expectedOrderedAccounts: ReturnType<typeof getOrderedAccountsFromAddressMap> = [
            {
                address: 'abc' as Address<'abc'>,
                role: AccountRole.WRITABLE_SIGNER,
            },
            {
                address: 'def' as Address<'def'>,
                role: AccountRole.READONLY,
            },
        ] as ReturnType<typeof getOrderedAccountsFromAddressMap>;
        beforeEach(() => {
            jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue(expectedOrderedAccounts);
        });
        it('sets `staticAccounts` to the return value of `getCompiledStaticAccounts`', () => {
            const message = compileTransactionMessage(baseTx);
            expect(getOrderedAccountsFromAddressMap).toHaveBeenCalled();
            expect(message.staticAccounts).toStrictEqual(['abc' as Address<'abc'>, 'def' as Address<'def'>]);
        });
    });
    describe('versions', () => {
        it('compiles the version', () => {
            const message = compileTransactionMessage(baseTx);
            expect(message).toHaveProperty('version', 'legacy');
        });
    });
});
