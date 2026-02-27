import { Address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';

import { TransactionMessageWithBlockhashLifetime } from '../../../blockhash';
import { TransactionMessageWithFeePayer } from '../../../fee-payer';
import { TransactionConfig } from '../../../transaction-config';
import { TransactionMessage } from '../../../transaction-message';
import {
    getAddressMapFromInstructions,
    getOrderedAccountsFromAddressMap,
    OrderedAccounts,
} from '../../legacy/accounts';
import { getCompiledMessageHeader } from '../../legacy/header';
import { getAccountIndex } from '../../legacy/instructions';
import { getCompiledLifetimeToken } from '../../legacy/lifetime-token';
import { getTransactionConfigMask, getTransactionConfigValues } from '../config';
import { getInstructionHeader, getInstructionPayload } from '../instructions';
import { compileTransactionMessage } from '../message';

jest.mock('../../legacy/accounts');
jest.mock('../../legacy/header');
jest.mock('../../legacy/instructions');
jest.mock('../../legacy/lifetime-token');
jest.mock('../config');
jest.mock('../instructions');

type V1TransactionMessage = TransactionMessage & TransactionMessageWithFeePayer & { version: 1 };
type V1Instruction = V1TransactionMessage['instructions'][number];

function makeMockTransactionMessage(overrides?: Partial<V1TransactionMessage>): V1TransactionMessage {
    return {
        feePayer: { address: 'abc' as Address },
        instructions: [] as V1Instruction[],
        version: 1,
        ...overrides,
    };
}

describe('compileTransactionMessage', () => {
    beforeEach(() => {
        jest.mocked(getAddressMapFromInstructions).mockReturnValue({});
        jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue([] as unknown as OrderedAccounts);
        jest.mocked(getAccountIndex).mockReturnValue({});
    });

    it('returns with version 1', () => {
        const tx = makeMockTransactionMessage();
        const message = compileTransactionMessage(tx);
        expect(message).toHaveProperty('version', 1);
    });

    it('sets `header` to the return value of `getCompiledMessageHeader`', () => {
        const expectedCompiledMessageHeader = {
            numReadonlyNonSignerAccounts: 0,
            numReadonlySignerAccounts: 0,
            numSignerAccounts: 1,
        } as const;
        jest.mocked(getCompiledMessageHeader).mockReturnValue(expectedCompiledMessageHeader);

        const tx = makeMockTransactionMessage();
        const message = compileTransactionMessage(tx);
        expect(getCompiledMessageHeader).toHaveBeenCalled();
        expect(message.header).toBe(expectedCompiledMessageHeader);
    });

    describe('config', () => {
        const expectedConfigMask = 0b00011111;
        const expectedConfigValues = [
            { kind: 'u64' as const, value: 10n },
            { kind: 'u32' as const, value: 20 },
        ];

        beforeEach(() => {
            jest.mocked(getTransactionConfigMask).mockReturnValue(expectedConfigMask);
            jest.mocked(getTransactionConfigValues).mockReturnValue(expectedConfigValues);
        });

        it('sets `configMask` to the return value of `getTransactionConfigMask`', () => {
            const config: TransactionConfig = {
                computeUnitLimit: 10,
            };
            const tx = makeMockTransactionMessage({ config });
            const message = compileTransactionMessage(tx);
            expect(getTransactionConfigMask).toHaveBeenCalledWith(tx.config);
            expect(message.configMask).toBe(expectedConfigMask);
        });

        it('sets `configValues` to the return value of `getTransactionConfigValues`', () => {
            const config: TransactionConfig = {
                computeUnitLimit: 10,
            };
            const tx = makeMockTransactionMessage({ config });
            const message = compileTransactionMessage(tx);
            expect(getTransactionConfigValues).toHaveBeenCalledWith(tx.config);
            expect(message.configValues).toBe(expectedConfigValues);
        });

        it('passes an empty object to config functions when config is missing', () => {
            const txWithoutConfig = makeMockTransactionMessage();
            compileTransactionMessage(txWithoutConfig);
            expect(getTransactionConfigMask).toHaveBeenCalledWith({});
            expect(getTransactionConfigValues).toHaveBeenCalledWith({});
        });
    });

    describe('lifetime constraints', () => {
        beforeEach(() => {
            jest.mocked(getCompiledLifetimeToken).mockReturnValue('abc');
        });
        it('sets `lifetimeToken` to the return value of `getCompiledLifetimeToken`', () => {
            const blockhash = 'myblockhash' as unknown as TransactionMessageWithBlockhashLifetime['lifetimeConstraint'];
            const tx = {
                ...makeMockTransactionMessage(),
                lifetimeConstraint: blockhash,
            };
            const message = compileTransactionMessage(tx);
            expect(getCompiledLifetimeToken).toHaveBeenCalledWith(blockhash);
            expect(message.lifetimeToken).toBe('abc');
        });
        it('does not set `lifetimeToken` when lifetime constraint is missing', () => {
            const txWithoutLifetime = makeMockTransactionMessage();
            const message = compileTransactionMessage(txWithoutLifetime);
            expect(message).not.toHaveProperty('lifetimeToken');
        });
    });

    describe('instructions', () => {
        const expectedInstructionHeader = {
            numInstructionAccounts: 2,
            numInstructionDataBytes: 3,
            programAccountIndex: 1,
        };

        const expectedInstructionPayload = {
            instructionAccountIndices: [2, 3],
            instructionData: new Uint8Array([1, 2, 3]),
        };

        beforeEach(() => {
            jest.mocked(getInstructionHeader).mockReturnValue(expectedInstructionHeader);
            jest.mocked(getInstructionPayload).mockReturnValue(expectedInstructionPayload);
        });

        it('sets `numInstructions` to the number of instructions', () => {
            const tx = makeMockTransactionMessage({
                instructions: [{} as V1Instruction, {} as V1Instruction],
            });
            const message = compileTransactionMessage(tx);
            expect(message.numInstructions).toBe(2);
        });

        it('sets `instructionHeaders` to the return values of `getInstructionHeader`', () => {
            const mockInstruction1 = {} as V1Instruction;
            const mockInstruction2 = {} as V1Instruction;
            const tx = makeMockTransactionMessage({
                instructions: [mockInstruction1, mockInstruction2],
            });
            const message = compileTransactionMessage(tx);
            expect(getInstructionHeader).toHaveBeenCalledTimes(2);
            expect(getInstructionHeader).toHaveBeenNthCalledWith(
                1,
                mockInstruction1,
                expect.anything() /* accountIndex */,
            );
            expect(getInstructionHeader).toHaveBeenNthCalledWith(
                2,
                mockInstruction2,
                expect.anything() /* accountIndex */,
            );
            expect(message.instructionHeaders).toEqual([expectedInstructionHeader, expectedInstructionHeader]);
        });

        it('sets `instructionPayloads` to the return values of `getInstructionPayload`', () => {
            const mockInstruction1 = {} as V1Instruction;
            const mockInstruction2 = {} as V1Instruction;
            const tx = makeMockTransactionMessage({
                instructions: [mockInstruction1, mockInstruction2],
            });
            const message = compileTransactionMessage(tx);
            expect(getInstructionPayload).toHaveBeenCalledTimes(2);
            expect(getInstructionPayload).toHaveBeenNthCalledWith(
                1,
                mockInstruction1,
                expect.anything() /* accountIndex */,
            );
            expect(getInstructionPayload).toHaveBeenNthCalledWith(
                2,
                mockInstruction2,
                expect.anything() /* accountIndex */,
            );
            expect(message.instructionPayloads).toEqual([expectedInstructionPayload, expectedInstructionPayload]);
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

        it('sets `staticAccounts` to the addresses from the ordered accounts', () => {
            const tx = makeMockTransactionMessage();
            const message = compileTransactionMessage(tx);
            expect(getOrderedAccountsFromAddressMap).toHaveBeenCalled();
            expect(message.staticAccounts).toStrictEqual(['abc' as Address<'abc'>, 'def' as Address<'def'>]);
        });
        it('sets `numStaticAccounts` to the number of ordered accounts', () => {
            const tx = makeMockTransactionMessage();
            const message = compileTransactionMessage(tx);
            expect(message.numStaticAccounts).toBe(2);
        });
    });
});
