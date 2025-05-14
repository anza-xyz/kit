import '@solana/test-matchers/toBeFrozenObject';

import { ImplicitArrayBuffer } from 'node:buffer';

import { address } from '@solana/addresses';
import { AccountRole, Instruction } from '@solana/instructions';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import { fromLegacyPublicKey } from '../address';
import { fromLegacyTransactionInstruction } from '../instruction';

function toLegacyByteArrayAppropriateForPlatform<TArrayBuffer extends ArrayBufferLike>(
    data: ImplicitArrayBuffer<TArrayBuffer>,
) {
    if (__NODEJS__) {
        return Buffer.from(data);
    } else {
        return new Uint8Array(data as TArrayBuffer) as Buffer<TArrayBuffer>;
    }
}

describe('fromLegacyTransactionInstruction', () => {
    it('converts a basic TransactionInstruction', () => {
        const programId = new Uint8Array([1, 2, 3, 4]);
        const keys = [
            {
                isSigner: false,
                isWritable: true,
                pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
            },
        ];
        const data = new Uint8Array([10, 20, 30]);

        const instruction = new TransactionInstruction({
            data: toLegacyByteArrayAppropriateForPlatform(data),
            keys,
            programId: new PublicKey(programId),
        });

        const converted = fromLegacyTransactionInstruction(instruction);

        expect(converted).toStrictEqual<Instruction>({
            accounts: [
                {
                    address: address('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
                    role: AccountRole.WRITABLE,
                },
            ],
            data,
            programAddress: fromLegacyPublicKey(new PublicKey(programId)),
        });
    });

    it('freezes the accounts array', () => {
        const programId = new Uint8Array([1, 2, 3, 4]);
        const keys = [
            {
                isSigner: false,
                isWritable: true,
                pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
            },
        ];
        const data = new Uint8Array([10, 20, 30]);

        const instruction = new TransactionInstruction({
            data: toLegacyByteArrayAppropriateForPlatform(data),
            keys,
            programId: new PublicKey(programId),
        });

        const converted = fromLegacyTransactionInstruction(instruction);

        expect(converted.accounts).toBeFrozenObject();
    });

    it('freezes each account', () => {
        const programId = new Uint8Array([1, 2, 3, 4]);
        const keys = [
            {
                isSigner: false,
                isWritable: true,
                pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
            },
        ];
        const data = new Uint8Array([10, 20, 30]);

        const instruction = new TransactionInstruction({
            data: toLegacyByteArrayAppropriateForPlatform(data),
            keys,
            programId: new PublicKey(programId),
        });

        const converted = fromLegacyTransactionInstruction(instruction);

        expect(converted.accounts?.[0]).toBeFrozenObject();
    });

    it('freezes the instruction', () => {
        const programId = new Uint8Array([1, 2, 3, 4]);
        const keys = [
            {
                isSigner: false,
                isWritable: true,
                pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
            },
        ];
        const data = new Uint8Array([10, 20, 30]);

        const instruction = new TransactionInstruction({
            data: toLegacyByteArrayAppropriateForPlatform(data),
            keys,
            programId: new PublicKey(programId),
        });

        const converted = fromLegacyTransactionInstruction(instruction);

        expect(converted).toBeFrozenObject();
    });

    it('applies no acccounts given an instruction with no keys', () => {
        const programId = new Uint8Array([5, 6, 7, 8]);
        const data = new Uint8Array([40, 50, 60]);

        const instruction = new TransactionInstruction({
            data: toLegacyByteArrayAppropriateForPlatform(data),
            keys: [],
            programId: new PublicKey(programId),
        });

        const converted = fromLegacyTransactionInstruction(instruction);

        expect(converted).toStrictEqual<Instruction>({
            data,
            programAddress: fromLegacyPublicKey(new PublicKey(programId)),
        });
    });

    it('handles an instruction with multiple keys', () => {
        const programId = new Uint8Array([9, 10, 11, 12]);
        const keys = [
            { isSigner: true, isWritable: true, pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK') },
            {
                isSigner: false,
                isWritable: false,
                pubkey: new PublicKey('9A87Qt8sxxLMe7hcrjC4cPnho1CwWKRpk84ZTRPyvWNw'),
            },
        ];
        const data = new Uint8Array([70, 80, 90]);

        const instruction = new TransactionInstruction({
            data: toLegacyByteArrayAppropriateForPlatform(data),
            keys,
            programId: new PublicKey(programId),
        });

        const converted = fromLegacyTransactionInstruction(instruction);

        expect(converted).toStrictEqual<Instruction>({
            accounts: [
                {
                    address: address('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
                    role: AccountRole.WRITABLE_SIGNER,
                },
                {
                    address: address('9A87Qt8sxxLMe7hcrjC4cPnho1CwWKRpk84ZTRPyvWNw'),
                    role: AccountRole.READONLY,
                },
            ],
            data,
            programAddress: fromLegacyPublicKey(new PublicKey(programId)),
        });
    });

    it('applies no data field if the data is zero-length', () => {
        const programId = new Uint8Array([13, 14, 15, 16]);
        const keys = [
            {
                isSigner: true,
                isWritable: false,
                pubkey: new PublicKey('F7Kzv7G6p1PvHXL1xXLPTm4myKWpLjnVphCV8ABZJfgT'),
            },
        ];

        const instruction = new TransactionInstruction({
            data: toLegacyByteArrayAppropriateForPlatform(new Uint8Array()),
            keys,
            programId: new PublicKey(programId),
        });

        const converted = fromLegacyTransactionInstruction(instruction);

        expect(converted).toStrictEqual<Instruction>({
            accounts: [
                {
                    address: address('F7Kzv7G6p1PvHXL1xXLPTm4myKWpLjnVphCV8ABZJfgT'),
                    role: AccountRole.READONLY_SIGNER,
                },
            ],
            programAddress: fromLegacyPublicKey(new PublicKey(programId)),
        });
    });

    it('applies no data field if the data is missing', () => {
        const programId = new Uint8Array([13, 14, 15, 16]);
        const keys = [
            {
                isSigner: true,
                isWritable: false,
                pubkey: new PublicKey('F7Kzv7G6p1PvHXL1xXLPTm4myKWpLjnVphCV8ABZJfgT'),
            },
        ];

        const instruction = new TransactionInstruction({
            keys,
            programId: new PublicKey(programId),
        });

        const converted = fromLegacyTransactionInstruction(instruction);

        expect(converted).toStrictEqual<Instruction>({
            accounts: [
                {
                    address: address('F7Kzv7G6p1PvHXL1xXLPTm4myKWpLjnVphCV8ABZJfgT'),
                    role: AccountRole.READONLY_SIGNER,
                },
            ],
            programAddress: fromLegacyPublicKey(new PublicKey(programId)),
        });
    });

    it.each`
        isSigner | isWritable | expected
        ${false} | ${false}   | ${AccountRole.READONLY}
        ${false} | ${true}    | ${AccountRole.WRITABLE}
        ${true}  | ${false}   | ${AccountRole.READONLY_SIGNER}
        ${true}  | ${true}    | ${AccountRole.WRITABLE_SIGNER}
    `(
        'converts keys with isSigner: $isSigner, isWritable: $isWritable to $expected',
        ({
            isSigner,
            isWritable,
            expected,
        }: {
            expected: keyof typeof AccountRole;
            isSigner: boolean;
            isWritable: boolean;
        }) => {
            expect(
                fromLegacyTransactionInstruction(
                    new TransactionInstruction({
                        keys: [{ isSigner, isWritable, pubkey: PublicKey.default }],
                        programId: PublicKey.default,
                    }),
                ),
            ).toHaveProperty('accounts', expect.arrayContaining([expect.objectContaining({ role: expected })]));
        },
    );
});
