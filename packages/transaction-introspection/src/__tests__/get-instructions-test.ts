import type { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
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
        expect(Array.from(result[0].data)).toStrictEqual([1, 2, 3]);
    });

    it('throws if a program address index is out of range', () => {
        const broken = {
            ...compiled,
            instructions: [{ accountIndices: [0], data: new Uint8Array(), programAddressIndex: 99 }],
        } as CompiledTransactionMessage;
        const err = getThrownError(() => getInstructionsFromCompiledTransactionMessage(broken));
        expect(err).toBeInstanceOf(SolanaError);
        expect((err as SolanaError).context.__code).toBe(
            SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
        );
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
        expect(Array.from(result[0].data)).toStrictEqual([1, 2, 3]);
    });

    it('throws SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED for unknown versions', () => {
        const vN = { ...compiled, version: 99 } as unknown as CompiledTransactionMessage;
        const err = getThrownError(() => getInstructionsFromCompiledTransactionMessage(vN));
        expect(err).toBeInstanceOf(SolanaError);
        expect((err as SolanaError).context.__code).toBe(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED);
        expect((err as SolanaError).context).toMatchObject({ unsupportedVersion: 99 });
    });
});

function getThrownError(fn: () => unknown): unknown {
    try {
        fn();
    } catch (e) {
        return e;
    }
    throw new Error('expected fn to throw');
}
