import type { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_ACCOUNT_INDEX_OUT_OF_RANGE,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
    SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH,
    SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED,
    SolanaError,
} from '@solana/errors';
import { AccountRole } from '@solana/instructions';
import type { CompiledTransactionMessage } from '@solana/transaction-messages';

import {
    getAccountMetasFromCompiledTransactionMessage,
    getInstructionsFromCompiledTransactionMessage,
} from '../get-instructions';

describe('getAccountMetasFromCompiledTransactionMessage', () => {
    it('produces signer/writable bits per the legacy header', () => {
        const compiled = {
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 1,
                numSignerAccounts: 2,
            },
            staticAccounts: [
                'writable-signer' as Address,
                'readonly-signer' as Address,
                'writable-nonsigner' as Address,
                'readonly-nonsigner' as Address,
            ],
            version: 'legacy',
        } as CompiledTransactionMessage;

        expect(getAccountMetasFromCompiledTransactionMessage(compiled)).toStrictEqual([
            { address: 'writable-signer', role: AccountRole.WRITABLE_SIGNER },
            { address: 'readonly-signer', role: AccountRole.READONLY_SIGNER },
            { address: 'writable-nonsigner', role: AccountRole.WRITABLE },
            { address: 'readonly-nonsigner', role: AccountRole.READONLY },
        ]);
    });

    it('appends ALT writable then ALT readonly with non-signer roles', () => {
        const compiled = {
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 1,
            },
            staticAccounts: ['fee-payer' as Address],
            version: 0,
        } as CompiledTransactionMessage;

        expect(
            getAccountMetasFromCompiledTransactionMessage(compiled, {
                readonly: ['alt-ro' as Address],
                writable: ['alt-w' as Address],
            }),
        ).toStrictEqual([
            { address: 'fee-payer', role: AccountRole.WRITABLE_SIGNER },
            { address: 'alt-w', role: AccountRole.WRITABLE },
            { address: 'alt-ro', role: AccountRole.READONLY },
        ]);
    });
});

describe('getInstructionsFromCompiledTransactionMessage', () => {
    const compiled = {
        header: {
            numReadonlyNonSignerAccounts: 1,
            numReadonlySignerAccounts: 0,
            numSignerAccounts: 1,
        },
        instructions: [
            {
                accountIndices: [0, 2],
                data: new Uint8Array([1, 2, 3]),
                programAddressIndex: 1,
            },
        ],
        staticAccounts: ['fee-payer' as Address, 'program' as Address],
        version: 'legacy',
    } as CompiledTransactionMessage;

    it('resolves program address and account metas', () => {
        const result = getInstructionsFromCompiledTransactionMessage(compiled, {
            readonly: [],
            writable: ['alt-w' as Address],
        });
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            accounts: [
                { address: 'fee-payer', role: AccountRole.WRITABLE_SIGNER },
                { address: 'alt-w', role: AccountRole.WRITABLE },
            ],
            programAddress: 'program',
        });
        expect(result[0].data).toStrictEqual(new Uint8Array([1, 2, 3]));
    });

    it('throws if a program address index is out of range', () => {
        const broken = {
            ...compiled,
            instructions: [{ accountIndices: [0], data: new Uint8Array(), programAddressIndex: 99 }],
        } as CompiledTransactionMessage;
        expect(() => getInstructionsFromCompiledTransactionMessage(broken)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
                index: 99,
            }),
        );
    });

    it('throws if an account index is out of range', () => {
        const broken = {
            ...compiled,
            instructions: [{ accountIndices: [42], data: new Uint8Array([1]), programAddressIndex: 1 }],
        } as CompiledTransactionMessage;
        expect(() => getInstructionsFromCompiledTransactionMessage(broken)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_ACCOUNT_INDEX_OUT_OF_RANGE, {
                index: 42,
            }),
        );
    });

    it('omits `accounts` and `data` when the compiled instruction has none', () => {
        const noArgs = {
            ...compiled,
            instructions: [{ programAddressIndex: 1 }],
        } as CompiledTransactionMessage;
        const [ix] = getInstructionsFromCompiledTransactionMessage(noArgs);
        expect(ix).not.toHaveProperty('accounts');
        expect(ix).not.toHaveProperty('data');
    });

    it('resolves v1 messages by zipping instructionHeaders + instructionPayloads', () => {
        const v1 = {
            configMask: 0,
            configValues: [],
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 1,
            },
            instructionHeaders: [{ numInstructionAccounts: 2, numInstructionDataBytes: 3, programAccountIndex: 1 }],
            instructionPayloads: [{ instructionAccountIndices: [0, 2], instructionData: new Uint8Array([1, 2, 3]) }],
            numInstructions: 1,
            numStaticAccounts: 2,
            staticAccounts: ['fee-payer' as Address, 'program' as Address],
            version: 1,
        } as unknown as CompiledTransactionMessage;

        const result = getInstructionsFromCompiledTransactionMessage(v1, {
            readonly: [],
            writable: ['alt-w' as Address],
        });
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            accounts: [
                { address: 'fee-payer', role: AccountRole.WRITABLE_SIGNER },
                { address: 'alt-w', role: AccountRole.WRITABLE },
            ],
            programAddress: 'program',
        });
        expect(result[0].data).toStrictEqual(new Uint8Array([1, 2, 3]));
    });

    it('throws SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH for mismatched v1 messages', () => {
        const v1 = {
            configMask: 0,
            configValues: [],
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 1,
            },
            instructionHeaders: [{ numInstructionAccounts: 0, numInstructionDataBytes: 0, programAccountIndex: 1 }],
            instructionPayloads: [],
            numInstructions: 1,
            numStaticAccounts: 2,
            staticAccounts: ['fee-payer' as Address, 'program' as Address],
            version: 1,
        } as unknown as CompiledTransactionMessage;
        expect(() => getInstructionsFromCompiledTransactionMessage(v1)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH, {
                numInstructionHeaders: 1,
                numInstructionPayloads: 0,
            }),
        );
    });

    it('throws SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED for unknown versions', () => {
        const vN = { ...compiled, version: 99 } as unknown as CompiledTransactionMessage;
        expect(() => getInstructionsFromCompiledTransactionMessage(vN)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, { unsupportedVersion: 99 }),
        );
    });
});
