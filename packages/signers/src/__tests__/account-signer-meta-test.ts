import { Address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS, SolanaError } from '@solana/errors';
import {
    getMessagePackerInstructionPlanFromInstructions,
    MessagePackerInstructionPlan,
    nonDivisibleSequentialInstructionPlan,
    parallelInstructionPlan,
    sequentialInstructionPlan,
    singleInstructionPlan,
} from '@solana/instruction-plans';
import { AccountRole } from '@solana/instructions';
import { createTransactionMessage } from '@solana/transaction-messages';

import {
    getSignersFromInstruction,
    getSignersFromInstructionPlan,
    getSignersFromTransactionMessage,
} from '../account-signer-meta';
import { setTransactionMessageFeePayerSigner } from '../fee-payer-signer';
import {
    createMockInstructionWithSigners,
    createMockTransactionMessageWithSigners,
    createMockTransactionModifyingSigner,
    createMockTransactionPartialSigner,
} from './__setup__';

describe('getSignersFromInstruction', () => {
    it('extracts signers from the account meta of the provided instruction', () => {
        // Given an instruction with two signers A and B.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const instruction = createMockInstructionWithSigners([signerA, signerB]);

        // When we extract the signers from the instruction's account metas.
        const extractedSigners = getSignersFromInstruction(instruction);

        // Then we expect signer A and B to be part of the extracted signers.
        expect(extractedSigners).toHaveLength(2);
        expect(extractedSigners[0]).toBe(signerA);
        expect(extractedSigners[1]).toBe(signerB);
    });

    it('removes duplicated signers by reference', () => {
        // Given an instruction with duplicated signers using the same reference.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const instruction = createMockInstructionWithSigners([signerA, signerB, signerA, signerA]);

        // When we extract the signers from the instruction's account metas.
        const extractedSigners = getSignersFromInstruction(instruction);

        // Then we expect the extracted signers to be deduplicated.
        expect(extractedSigners).toHaveLength(2);
        expect(extractedSigners.map(signer => signer.address).sort()).toStrictEqual(['1111', '2222']);
    });
});

describe('getSignersFromInstructionPlan', () => {
    it('extracts signers from a single instruction plan', () => {
        // Given a single instruction plan with two signers A and B.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const plan = singleInstructionPlan(createMockInstructionWithSigners([signerA, signerB]));

        // When we extract the signers from the instruction plan.
        const extractedSigners = getSignersFromInstructionPlan(plan);

        // Then we expect signer A and B to be part of the extracted signers.
        expect(extractedSigners).toStrictEqual([signerA, signerB]);
    });

    it('extracts signers from a sequential instruction plan', () => {
        // Given a sequential instruction plan with instructions signed by A and B.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const plan = sequentialInstructionPlan([
            createMockInstructionWithSigners([signerA]),
            createMockInstructionWithSigners([signerB]),
        ]);

        // When we extract the signers from the instruction plan.
        const extractedSigners = getSignersFromInstructionPlan(plan);

        // Then we expect signer A and B to be part of the extracted signers.
        expect(extractedSigners).toStrictEqual([signerA, signerB]);
    });

    it('extracts signers from a non-divisible sequential instruction plan', () => {
        // Given a non-divisible sequential instruction plan with instructions signed by A and B.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const plan = nonDivisibleSequentialInstructionPlan([
            createMockInstructionWithSigners([signerA]),
            createMockInstructionWithSigners([signerB]),
        ]);

        // When we extract the signers from the instruction plan.
        const extractedSigners = getSignersFromInstructionPlan(plan);

        // Then we expect signer A and B to be part of the extracted signers.
        expect(extractedSigners).toStrictEqual([signerA, signerB]);
    });

    it('extracts signers from a parallel instruction plan', () => {
        // Given a parallel instruction plan with instructions signed by A and B.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const plan = parallelInstructionPlan([
            createMockInstructionWithSigners([signerA]),
            createMockInstructionWithSigners([signerB]),
        ]);

        // When we extract the signers from the instruction plan.
        const extractedSigners = getSignersFromInstructionPlan(plan);

        // Then we expect signer A and B to be part of the extracted signers.
        expect(extractedSigners).toStrictEqual([signerA, signerB]);
    });

    it('extracts signers from nested instruction plans', () => {
        // Given nested instruction plans with instructions signed by A, B and C.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionPartialSigner('2222' as Address);
        const signerC = createMockTransactionModifyingSigner('3333' as Address);
        const plan = sequentialInstructionPlan([
            createMockInstructionWithSigners([signerA]),
            parallelInstructionPlan([
                nonDivisibleSequentialInstructionPlan([createMockInstructionWithSigners([signerB])]),
                createMockInstructionWithSigners([signerC]),
            ]),
        ]);

        // When we extract the signers from the instruction plan.
        const extractedSigners = getSignersFromInstructionPlan(plan);

        // Then we expect signer A, B and C to be part of the extracted signers.
        expect(extractedSigners).toStrictEqual([signerA, signerB, signerC]);
    });

    it('removes duplicated signers across instructions', () => {
        // Given an instruction plan with the same signers used across multiple instructions.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const plan = parallelInstructionPlan([
            createMockInstructionWithSigners([signerA, signerB]),
            sequentialInstructionPlan([
                createMockInstructionWithSigners([signerB]),
                createMockInstructionWithSigners([signerA]),
            ]),
        ]);

        // When we extract the signers from the instruction plan.
        const extractedSigners = getSignersFromInstructionPlan(plan);

        // Then we expect the extracted signers to be deduplicated.
        expect(extractedSigners).toStrictEqual([signerA, signerB]);
    });

    it('throws when different signers share the same address across instructions', () => {
        // Given an instruction plan with two different signers sharing the same address.
        const plan = sequentialInstructionPlan([
            createMockInstructionWithSigners([createMockTransactionPartialSigner('1111' as Address)]),
            createMockInstructionWithSigners([createMockTransactionModifyingSigner('1111' as Address)]),
        ]);

        // When we extract the signers from the instruction plan.
        const fn = () => getSignersFromInstructionPlan(plan);

        // Then we expect an error to be thrown.
        expect(fn).toThrow(
            new SolanaError(SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS, {
                address: '1111' as Address,
            }),
        );
    });

    it('ignores instructions without signers', () => {
        // Given an instruction plan where only one instruction has a signer.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const plan = sequentialInstructionPlan([
            { programAddress: '11111111111111111111111111111111' as Address },
            {
                accounts: [{ address: '2222' as Address, role: AccountRole.WRITABLE }],
                programAddress: '11111111111111111111111111111111' as Address,
            },
            createMockInstructionWithSigners([signerA]),
        ]);

        // When we extract the signers from the instruction plan.
        const extractedSigners = getSignersFromInstructionPlan(plan);

        // Then we expect only signer A to be extracted.
        expect(extractedSigners).toStrictEqual([signerA]);
    });

    it('returns an empty array when the plan has no signers', () => {
        // Given an instruction plan without any signers.
        const plan = parallelInstructionPlan([
            { programAddress: '11111111111111111111111111111111' as Address },
            sequentialInstructionPlan([]),
        ]);

        // When we extract the signers from the instruction plan.
        const extractedSigners = getSignersFromInstructionPlan(plan);

        // Then we expect no signers to be extracted.
        expect(extractedSigners).toStrictEqual([]);
    });

    it('skips message packer instruction plans without requesting their message packer', () => {
        // Given an instruction plan containing a message packer plan whose message packer must not be requested.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionPartialSigner('2222' as Address);
        const messagePackerPlan: MessagePackerInstructionPlan = {
            ...getMessagePackerInstructionPlanFromInstructions([createMockInstructionWithSigners([signerB])]),
            getMessagePacker: jest.fn().mockImplementation(() => {
                throw new Error('not implemented');
            }),
        };
        const plan = sequentialInstructionPlan([createMockInstructionWithSigners([signerA]), messagePackerPlan]);

        // When we extract the signers from the instruction plan.
        const extractedSigners = getSignersFromInstructionPlan(plan);

        // Then we expect only the signers outside the message packer plan to be extracted.
        expect(extractedSigners).toStrictEqual([signerA]);

        // And we expect the message packer not to have been requested.
        expect(messagePackerPlan.getMessagePacker).not.toHaveBeenCalled();
    });
});

describe('getSignersFromTransactionMessage', () => {
    it('extracts signers from the account meta of the provided transaction', () => {
        // Given a transaction with two signers A and B.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const transaction = createMockTransactionMessageWithSigners([signerA, signerB]);

        // When we extract the signers from the transaction's account metas.
        const extractedSigners = getSignersFromTransactionMessage(transaction);

        // Then we expect signer A and B to be part of the extracted signers.
        expect(extractedSigners).toHaveLength(2);
        expect(extractedSigners[0]).toBe(signerA);
        expect(extractedSigners[1]).toBe(signerB);
    });

    it('extracts the fee payer signer of the provided transaction', () => {
        // Given a transaction with a signer fee payer.
        const feePayer = createMockTransactionPartialSigner('1111' as Address);
        const transaction = setTransactionMessageFeePayerSigner(feePayer, createTransactionMessage({ version: 0 }));

        // When we extract the signers from the transaction.
        const extractedSigners = getSignersFromTransactionMessage(transaction);

        // Then we expect the extracted signers to contain the fee payer signer.
        expect(extractedSigners).toHaveLength(1);
        expect(extractedSigners[0]).toBe(feePayer);
    });

    it('removes duplicated signers', () => {
        // Given a transaction with duplicated signers using the same reference.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const transaction = createMockTransactionMessageWithSigners([signerA, signerB, signerA, signerA]);

        // When we extract the signers from the transaction's account metas.
        const extractedSigners = getSignersFromTransactionMessage(transaction);

        // Then we expect the extracted signers to be deduplicated.
        expect(extractedSigners).toHaveLength(2);
        expect(extractedSigners.map(signer => signer.address).sort()).toStrictEqual(['1111', '2222']);
    });
});
