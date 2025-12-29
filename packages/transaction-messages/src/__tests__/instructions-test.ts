import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, SolanaError } from '@solana/errors';
import { Instruction } from '@solana/instructions';

import {
    appendTransactionMessageInstruction,
    appendTransactionMessageInstructions,
    prependTransactionMessageInstruction,
    prependTransactionMessageInstructions,
} from '../instructions';
import { BaseTransactionMessage } from '../transaction-message';
import { TRANSACTION_MESSAGE_INSTRUCTION_LIMIT } from '../transaction-message-instruction-limit';

const PROGRAM_A =
    'AALQD2dt1k43Acrkp4SvdhZaN4S115Ff2Bi7rHPti3sL' as Address<'AALQD2dt1k43Acrkp4SvdhZaN4S115Ff2Bi7rHPti3sL'>;
const PROGRAM_B =
    'DNAbkMkoMLRXF7wuLCrTzouMyzi25krr3B94yW87VvxU' as Address<'DNAbkMkoMLRXF7wuLCrTzouMyzi25krr3B94yW87VvxU'>;
const PROGRAM_C =
    '6Bkt4j67rxzFF6s9DaMRyfitftRrGxe4oYHPRHuFChzi' as Address<'6Bkt4j67rxzFF6s9DaMRyfitftRrGxe4oYHPRHuFChzi'>;

describe('Transaction instruction helpers', () => {
    let baseTx: BaseTransactionMessage;
    let exampleInstruction: Instruction<string>;
    let secondExampleInstruction: Instruction<string>;
    beforeEach(() => {
        baseTx = {
            instructions: [
                {
                    programAddress: PROGRAM_A,
                },
            ],
            version: 0,
        };
        exampleInstruction = {
            programAddress: PROGRAM_B,
        };
        secondExampleInstruction = {
            programAddress: PROGRAM_C,
        };
    });
    describe('appendTransactionMessageInstruction', () => {
        it('adds the instruction to the end of the list', () => {
            const txWithAddedInstruction = appendTransactionMessageInstruction(exampleInstruction, baseTx);
            expect(txWithAddedInstruction.instructions).toMatchObject([...baseTx.instructions, exampleInstruction]);
        });
        it('freezes the object', () => {
            const txWithAddedInstruction = appendTransactionMessageInstruction(exampleInstruction, baseTx);
            expect(txWithAddedInstruction).toBeFrozenObject();
        });
        it('freezes the instructions array', () => {
            const txWithAddedInstruction = appendTransactionMessageInstruction(exampleInstruction, baseTx);
            expect(txWithAddedInstruction.instructions).toBeFrozenObject();
        });
        it('throws when adding instructions exceeds the instruction limit', () => {
            const fullTx: BaseTransactionMessage = {
                instructions: new Array(TRANSACTION_MESSAGE_INSTRUCTION_LIMIT).fill({
                    programAddress: PROGRAM_A,
                }),
                version: 0,
            };
            expect(() => appendTransactionMessageInstruction(exampleInstruction, fullTx)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, {
                    instructionCount: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT + 1,
                    instructionLimit: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT,
                }),
            );
        });
    });
    describe('appendTransactionMessageInstructions', () => {
        it('adds the instructions to the end of the list', () => {
            const txWithAddedInstructions = appendTransactionMessageInstructions(
                [exampleInstruction, secondExampleInstruction],
                baseTx,
            );
            expect(txWithAddedInstructions.instructions).toMatchObject([
                ...baseTx.instructions,
                exampleInstruction,
                secondExampleInstruction,
            ]);
        });
        it('freezes the object', () => {
            const txWithAddedInstruction = appendTransactionMessageInstructions(
                [exampleInstruction, secondExampleInstruction],
                baseTx,
            );
            expect(txWithAddedInstruction).toBeFrozenObject();
        });
        it('freezes the instructions array', () => {
            const txWithAddedInstruction = appendTransactionMessageInstructions(
                [exampleInstruction, secondExampleInstruction],
                baseTx,
            );
            expect(txWithAddedInstruction.instructions).toBeFrozenObject();
        });
        it('throws when adding instructions exceeds the instruction limit', () => {
            const fullTx: BaseTransactionMessage = {
                instructions: new Array(TRANSACTION_MESSAGE_INSTRUCTION_LIMIT).fill({
                    programAddress: PROGRAM_A,
                }),
                version: 0,
            };
            expect(() => appendTransactionMessageInstructions([exampleInstruction], fullTx)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, {
                    instructionCount: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT + 1,
                    instructionLimit: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT,
                }),
            );
        });
    });
    describe('prependTransactionMessageInstruction', () => {
        it('adds the instruction to the beginning of the list', () => {
            const txWithAddedInstruction = prependTransactionMessageInstruction(exampleInstruction, baseTx);
            expect(txWithAddedInstruction.instructions).toMatchObject([exampleInstruction, ...baseTx.instructions]);
        });
        it('freezes the object', () => {
            const txWithAddedInstruction = prependTransactionMessageInstruction(exampleInstruction, baseTx);
            expect(txWithAddedInstruction).toBeFrozenObject();
        });
        it('freezes the instructions array', () => {
            const txWithAddedInstruction = prependTransactionMessageInstruction(exampleInstruction, baseTx);
            expect(txWithAddedInstruction.instructions).toBeFrozenObject();
        });
        it('throws when adding instructions exceeds the instruction limit', () => {
            const fullTx: BaseTransactionMessage = {
                instructions: new Array(TRANSACTION_MESSAGE_INSTRUCTION_LIMIT).fill({
                    programAddress: PROGRAM_A,
                }),
                version: 0,
            };
            expect(() => prependTransactionMessageInstruction(exampleInstruction, fullTx)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, {
                    instructionCount: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT + 1,
                    instructionLimit: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT,
                }),
            );
        });
    });
    describe('prependTransactionMessageInstructions', () => {
        it('adds the instructions to the beginning of the list', () => {
            const txWithAddedInstruction = prependTransactionMessageInstructions(
                [exampleInstruction, secondExampleInstruction],
                baseTx,
            );
            expect(txWithAddedInstruction.instructions).toMatchObject([
                exampleInstruction,
                secondExampleInstruction,
                ...baseTx.instructions,
            ]);
        });
        it('freezes the object', () => {
            const txWithAddedInstruction = prependTransactionMessageInstructions(
                [exampleInstruction, secondExampleInstruction],
                baseTx,
            );
            expect(txWithAddedInstruction).toBeFrozenObject();
        });
        it('freezes the instructions array', () => {
            const txWithAddedInstruction = prependTransactionMessageInstructions(
                [exampleInstruction, secondExampleInstruction],
                baseTx,
            );
            expect(txWithAddedInstruction.instructions).toBeFrozenObject();
        });
        it('throws when adding instructions exceeds the instruction limit', () => {
            const fullTx: BaseTransactionMessage = {
                instructions: new Array(TRANSACTION_MESSAGE_INSTRUCTION_LIMIT).fill({
                    programAddress: PROGRAM_A,
                }),
                version: 0,
            };
            expect(() => prependTransactionMessageInstructions([exampleInstruction], fullTx)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, {
                    instructionCount: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT + 1,
                    instructionLimit: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT,
                }),
            );
        });
    });
});
