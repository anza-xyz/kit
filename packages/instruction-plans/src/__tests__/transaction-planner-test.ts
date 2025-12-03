import '@solana/test-matchers/toBeFrozenObject';

import { SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, SolanaError } from '@solana/errors';
import { Instruction } from '@solana/instructions';
import {
    appendTransactionMessageInstructions,
    BaseTransactionMessage,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { getTransactionMessageSize, TRANSACTION_SIZE_LIMIT } from '@solana/transactions';

import {
    InstructionPlan,
    nonDivisibleSequentialInstructionPlan,
    parallelInstructionPlan,
    sequentialInstructionPlan,
    singleInstructionPlan,
} from '../instruction-plan';
import {
    nonDivisibleSequentialTransactionPlan,
    ParallelTransactionPlan,
    parallelTransactionPlan,
    SequentialTransactionPlan,
    sequentialTransactionPlan,
    SingleTransactionPlan,
    singleTransactionPlan,
    TransactionPlan,
} from '../transaction-plan';
import { createTransactionPlanner, TransactionPlanner } from '../transaction-planner';
import {
    createMessage,
    createMessagePackerInstructionPlan,
    FOREVER_PROMISE,
    instructionFactory,
    transactionPercentFactory,
} from './__setup__';

function createMockTransactionMessage(): BaseTransactionMessage & TransactionMessageWithFeePayer {
    return createMessage('mock-message');
}

function getHelpers(createTransactionMessage: () => BaseTransactionMessage & TransactionMessageWithFeePayer) {
    return {
        instruction: instructionFactory(),
        singleTransactionPlan: (instructions: Instruction[]) =>
            singleTransactionPlan(appendTransactionMessageInstructions(instructions, createTransactionMessage())),
        txPercent: transactionPercentFactory(createTransactionMessage),
    };
}

describe('createTransactionPlanner', () => {
    describe('single scenarios', () => {
        /**
         *  [A: 42] ───────────────────▶ [Tx: A]
         */
        it('plans a single instruction', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', 42);

            await expect(planner(singleInstructionPlan(instructionA))).resolves.toEqual(
                singleTransactionPlan([instructionA]),
            );
        });

        /**
         *  [A: 200%] ───────────────────▶ Error
         */
        it('fail if a single instruction is too large', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(200));
            const instructionPlan = singleInstructionPlan(instructionA);

            const newMessage = createTransactionMessage();
            const newMessageSize = getTransactionMessageSize(newMessage);
            const impossibleMessageSize = getTransactionMessageSize(
                appendTransactionMessageInstructions([instructionA], newMessage),
            );

            await expect(planner(instructionPlan)).rejects.toThrow(
                new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
                    numBytesRequired: impossibleMessageSize - newMessageSize,
                    numFreeBytes: TRANSACTION_SIZE_LIMIT - newMessageSize,
                }),
            );
        });
    });

    describe('sequential scenarios', () => {
        /**
         *  [Seq] ───────────────────▶ [Tx: A + B]
         *   │
         *   ├── [A: 50%]
         *   └── [B: 50%]
         */
        it('plans a sequential plan with instructions that all fit in a single transaction', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        singleInstructionPlan(instructionB),
                    ]),
                ),
            ).resolves.toEqual(singleTransactionPlan([instructionA, instructionB]));
        });

        /**
         *  [Seq] ───────────────────▶ [Seq]
         *   │                          │
         *   ├── [A: 50%]               ├── [Tx: A + B]
         *   ├── [B: 50%]               └── [Tx: C]
         *   └── [C: 50%]
         */
        it('plans a sequential plan with instructions that must be split accross multiple transactions (v1)', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));
            const instructionC = instruction('C', txPercent(50));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        singleInstructionPlan(instructionB),
                        singleInstructionPlan(instructionC),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    singleTransactionPlan([instructionC]),
                ]),
            );
        });

        /**
         *  [Seq] ───────────────────▶ [Seq]
         *   │                          │
         *   ├── [A: 60%]               ├── [Tx: A]
         *   ├── [B: 50%]               └── [Tx: B + C]
         *   └── [C: 50%]
         */
        it('plans a sequential plan with instructions that must be split accross multiple transactions (v2)', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(60)); // Tx A cannot have Ix B.
            const instructionB = instruction('B', txPercent(50));
            const instructionC = instruction('C', txPercent(50));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        singleInstructionPlan(instructionB),
                        singleInstructionPlan(instructionC),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([instructionA]),
                    singleTransactionPlan([instructionB, instructionC]),
                ]),
            );
        });

        /**
         *  [Seq] ───────────────────▶ [Tx: A + B]
         *   │
         *   ├── [A: 50%]
         *   ├── [Seq]
         *   └── [Seq]
         *        └── [B: 50%]
         */
        it('simplifies sequential plans with one child or less', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        sequentialInstructionPlan([]),
                        sequentialInstructionPlan([singleInstructionPlan(instructionB)]),
                    ]),
                ),
            ).resolves.toEqual(singleTransactionPlan([instructionA, instructionB]));
        });

        /**
         *  [Seq] ──────────────────────▶ [Seq]
         *   │                             │
         *   ├── [A: 100%]                 ├── [Tx: A]
         *   └── [Seq]                     ├── [Tx: B]
         *        ├── [B: 100%]            └── [Tx: C]
         *        └── [C: 100%]
         */
        it('simplifies nested sequential plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(100));
            const instructionB = instruction('B', txPercent(100));
            const instructionC = instruction('C', txPercent(100));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionB),
                            singleInstructionPlan(instructionC),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([instructionA]),
                    singleTransactionPlan([instructionB]),
                    singleTransactionPlan([instructionC]),
                ]),
            );
        });

        /**
         *  [Seq] ──────────────────────▶ [Seq]
         *   │                             │
         *   ├── [A: 50%]                  ├── [Tx: A + B]
         *   ├── [Seq]                     └── [Tx: C + D]
         *   │    ├── [B: 50%]
         *   │    └── [C: 50%]
         *   └── [D: 50%]
         */
        it('simplifies sequential plans nested in the middle', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));
            const instructionC = instruction('C', txPercent(50));
            const instructionD = instruction('D', txPercent(50));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionB),
                            singleInstructionPlan(instructionC),
                        ]),
                        singleInstructionPlan(instructionD),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    singleTransactionPlan([instructionC, instructionD]),
                ]),
            );
        });
    });

    describe('parallel scenarios', () => {
        /**
         *  [Par] ───────────────────▶ [Tx: A + B]
         *   │
         *   ├── [A: 50%]
         *   └── [B: 50%]
         */
        it('plans a parallel plan with instructions that all fit in a single transaction', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));

            await expect(
                planner(
                    parallelInstructionPlan([singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)]),
                ),
            ).resolves.toEqual(singleTransactionPlan([instructionA, instructionB]));
        });

        /**
         *  [Par] ───────────────────▶ [Par]
         *   │                          │
         *   ├── [A: 50%]               ├── [Tx: A + B]
         *   ├── [B: 50%]               └── [Tx: C]
         *   └── [C: 50%]
         */
        it('plans a parallel plan with instructions that must be split accross multiple transactions (v1)', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));
            const instructionC = instruction('C', txPercent(50));

            await expect(
                planner(
                    parallelInstructionPlan([
                        singleInstructionPlan(instructionA),
                        singleInstructionPlan(instructionB),
                        singleInstructionPlan(instructionC),
                    ]),
                ),
            ).resolves.toEqual(
                parallelTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    singleTransactionPlan([instructionC]),
                ]),
            );
        });

        /**
         *  [Par] ───────────────────▶ [Par]
         *   │                          │
         *   ├── [A: 60%]               ├── [Tx: A]
         *   ├── [B: 50%]               └── [Tx: B + C]
         *   └── [C: 50%]
         */
        it('plans a parallel plan with instructions that must be split accross multiple transactions (v2)', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(60)); // Tx A cannot have Ix B.
            const instructionB = instruction('B', txPercent(50));
            const instructionC = instruction('C', txPercent(50));

            await expect(
                planner(
                    parallelInstructionPlan([
                        singleInstructionPlan(instructionA),
                        singleInstructionPlan(instructionB),
                        singleInstructionPlan(instructionC),
                    ]),
                ),
            ).resolves.toEqual(
                parallelTransactionPlan([
                    singleTransactionPlan([instructionA]),
                    singleTransactionPlan([instructionB, instructionC]),
                ]),
            );
        });

        /**
         *  [Par] ───────────────────▶ [Tx: A + B]
         *   │
         *   ├── [A: 50%]
         *   ├── [Par]
         *   └── [Par]
         *        └── [B: 50%]
         */
        it('simplifies parallel plans with one child or less', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));

            await expect(
                planner(
                    parallelInstructionPlan([
                        singleInstructionPlan(instructionA),
                        parallelInstructionPlan([]),
                        parallelInstructionPlan([singleInstructionPlan(instructionB)]),
                    ]),
                ),
            ).resolves.toEqual(singleTransactionPlan([instructionA, instructionB]));
        });

        /**
         *  [Par] ──────────────────────▶ [Par]
         *   │                             │
         *   ├── [A: 100%]                 ├── [Tx: A]
         *   └── [Par]                     ├── [Tx: B]
         *        ├── [B: 100%]            └── [Tx: C]
         *        └── [C: 100%]
         */
        it('simplifies nested parallel plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(100));
            const instructionB = instruction('B', txPercent(100));
            const instructionC = instruction('C', txPercent(100));

            await expect(
                planner(
                    parallelInstructionPlan([
                        singleInstructionPlan(instructionA),
                        parallelInstructionPlan([
                            singleInstructionPlan(instructionB),
                            singleInstructionPlan(instructionC),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                parallelTransactionPlan([
                    singleTransactionPlan([instructionA]),
                    singleTransactionPlan([instructionB]),
                    singleTransactionPlan([instructionC]),
                ]),
            );
        });

        /**
         *  [Par] ───────────────────▶ [Par]
         *   │                          │
         *   ├── [Seq]                  ├── [Tx: A + B + D]
         *   │    ├── [A: 50%]          └── [Tx: C]
         *   │    └── [B: 25%]
         *   ├── [C: 90%]
         *   └── [D: 25%]
         */
        it('re-uses previous parallel transactions if there is space', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(25));
            const instructionC = instruction('C', txPercent(90));
            const instructionD = instruction('D', txPercent(25));

            await expect(
                planner(
                    parallelInstructionPlan([
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        singleInstructionPlan(instructionC),
                        singleInstructionPlan(instructionD),
                    ]),
                ),
            ).resolves.toEqual(
                parallelTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB, instructionD]),
                    singleTransactionPlan([instructionC]),
                ]),
            );
        });

        /**
         *  [Par] ───────────────────▶ [Tx: A + B + C + D]
         *   │
         *   ├── [Seq]
         *   │    ├── [A: 25%]
         *   │    └── [B: 25%]
         *   └── [Seq]
         *        ├── [C: 25%]
         *        └── [D: 25%]
         */
        it('can merge sequential plans in a parallel plan if the whole sequential plan fits', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(25));
            const instructionB = instruction('B', txPercent(25));
            const instructionC = instruction('C', txPercent(25));
            const instructionD = instruction('D', txPercent(25));

            await expect(
                planner(
                    parallelInstructionPlan([
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionC),
                            singleInstructionPlan(instructionD),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(singleTransactionPlan([instructionA, instructionB, instructionC, instructionD]));
        });

        /**
         *  [Par] ───────────────────▶ [Par]
         *   │                          │
         *   ├── [Seq]                  ├── [Tx: A + B]
         *   │    ├── [A: 33%]          └── [Tx: C + D]
         *   │    └── [B: 33%]
         *   └── [Seq]
         *        ├── [C: 33%]
         *        └── [D: 33%]
         */
        it('does not split a sequential plan on a parallel parent', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(33));
            const instructionB = instruction('B', txPercent(33));
            const instructionC = instruction('C', txPercent(33));
            const instructionD = instruction('D', txPercent(33));

            await expect(
                planner(
                    parallelInstructionPlan([
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionC),
                            singleInstructionPlan(instructionD),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                parallelTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    singleTransactionPlan([instructionC, instructionD]),
                ]),
            );
        });

        /**
         *  [Seq] ───────────────────▶ [Seq]
         *   │                          │
         *   ├── [Par]                  ├── [Tx: A + B + C]
         *   │    ├── [A: 33%]          └── [Tx: D]
         *   │    └── [B: 33%]
         *   └── [Par]
         *        ├── [C: 33%]
         *        └── [D: 33%]
         */
        it('can split parallel plans inside sequential plans as long as they follow the sequence', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(33));
            const instructionB = instruction('B', txPercent(33));
            const instructionC = instruction('C', txPercent(33));
            const instructionD = instruction('D', txPercent(33));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        parallelInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        parallelInstructionPlan([
                            singleInstructionPlan(instructionC),
                            singleInstructionPlan(instructionD),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB, instructionC]),
                    singleTransactionPlan([instructionD]),
                ]),
            );
        });

        /**
         *  [Seq] ───────────────────▶ [Seq]
         *   │                          │
         *   ├── [Par]                  ├── [Tx: A + B]
         *   │    ├── [A: 33%]          ├── [Tx: C + D]
         *   │    └── [B: 33%]          └── [Tx: E + F]
         *   ├── [Par]
         *   │    ├── [C: 50%]
         *   │    └── [D: 50%]
         *   └── [Par]
         *         ├── [E: 33%]
         *         └── [F: 33%]
         */
        it('cannnot split a parallel plan in a sequential plan if that would break the sequence', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(33));
            const instructionB = instruction('B', txPercent(33));
            const instructionC = instruction('C', txPercent(50));
            const instructionD = instruction('D', txPercent(50));
            const instructionE = instruction('E', txPercent(33));
            const instructionF = instruction('F', txPercent(33));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        parallelInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        parallelInstructionPlan([
                            singleInstructionPlan(instructionC),
                            singleInstructionPlan(instructionD),
                        ]),
                        parallelInstructionPlan([
                            singleInstructionPlan(instructionE),
                            singleInstructionPlan(instructionF),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    singleTransactionPlan([instructionC, instructionD]),
                    singleTransactionPlan([instructionE, instructionF]),
                ]),
            );
        });
    });

    describe('non-divisible sequential scenarios', () => {
        /**
         *  [NonDivSeq] ───────────────────▶ [Tx: A + B]
         *   │
         *   ├── [A: 50%]
         *   └── [B: 50%]
         */
        it('plans an non-divisible sequential plan with instructions that all fit in a single transaction', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));

            await expect(
                planner(
                    nonDivisibleSequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        singleInstructionPlan(instructionB),
                    ]),
                ),
            ).resolves.toEqual(singleTransactionPlan([instructionA, instructionB]));
        });

        /**
         *  [NonDivSeq] ─────────────▶ [NonDivSeq]
         *   │                          │
         *   ├── [A: 50%]               ├── [Tx: A + B]
         *   ├── [B: 50%]               └── [Tx: C]
         *   └── [C: 50%]
         */
        it('plans a non-divisible sequential plan with instructions that must be split accross multiple transactions (v1)', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));
            const instructionC = instruction('C', txPercent(50));

            await expect(
                planner(
                    nonDivisibleSequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        singleInstructionPlan(instructionB),
                        singleInstructionPlan(instructionC),
                    ]),
                ),
            ).resolves.toEqual(
                nonDivisibleSequentialTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    singleTransactionPlan([instructionC]),
                ]),
            );
        });

        /**
         *  [NonDivSeq] ─────────────▶ [NonDivSeq]
         *   │                          │
         *   ├── [A: 60%]               ├── [Tx: A]
         *   ├── [B: 50%]               └── [Tx: B + C]
         *   └── [C: 50%]
         */
        it('plans a non-divisible sequential plan with instructions that must be split accross multiple transactions (v2)', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(60)); // Tx A cannot have Ix B.
            const instructionB = instruction('B', txPercent(50));
            const instructionC = instruction('C', txPercent(50));

            await expect(
                planner(
                    nonDivisibleSequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        singleInstructionPlan(instructionB),
                        singleInstructionPlan(instructionC),
                    ]),
                ),
            ).resolves.toEqual(
                nonDivisibleSequentialTransactionPlan([
                    singleTransactionPlan([instructionA]),
                    singleTransactionPlan([instructionB, instructionC]),
                ]),
            );
        });

        /**
         *  [NonDivSeq] ─────────────▶ [Tx: A + B]
         *   │
         *   ├── [A: 50%]
         *   ├── [NonDivSeq]
         *   └── [NonDivSeq]
         *        └── [B: 50%]
         */
        it('simplifies non-divisible sequential plans with one child or less', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));

            await expect(
                planner(
                    nonDivisibleSequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        nonDivisibleSequentialInstructionPlan([]),
                        nonDivisibleSequentialInstructionPlan([singleInstructionPlan(instructionB)]),
                    ]),
                ),
            ).resolves.toEqual(singleTransactionPlan([instructionA, instructionB]));
        });

        /**
         *  [NonDivSeq] ────────────────▶ [NonDivSeq]
         *   │                             │
         *   ├── [A: 100%]                 ├── [Tx: A]
         *   └── [NonDivSeq]               ├── [Tx: B]
         *        ├── [B: 100%]            └── [Tx: C]
         *        └── [C: 100%]
         */
        it('simplifies nested non-divisible sequential plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(100));
            const instructionB = instruction('B', txPercent(100));
            const instructionC = instruction('C', txPercent(100));

            await expect(
                planner(
                    nonDivisibleSequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionB),
                            singleInstructionPlan(instructionC),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                nonDivisibleSequentialTransactionPlan([
                    singleTransactionPlan([instructionA]),
                    singleTransactionPlan([instructionB]),
                    singleTransactionPlan([instructionC]),
                ]),
            );
        });

        /**
         *  [NonDivSeq] ────────────────▶ [NonDivSeq]
         *   │                             │
         *   ├── [A: 100%]                 ├── [Tx: A]
         *   └── [Seq]                     ├── [Tx: B]
         *        ├── [B: 100%]            └── [Tx: C]
         *        └── [C: 100%]
         */
        it('simplifies divisible sequential plans inside non-divisible sequential plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(100));
            const instructionB = instruction('B', txPercent(100));
            const instructionC = instruction('C', txPercent(100));

            await expect(
                planner(
                    nonDivisibleSequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionB),
                            singleInstructionPlan(instructionC),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                nonDivisibleSequentialTransactionPlan([
                    singleTransactionPlan([instructionA]),
                    singleTransactionPlan([instructionB]),
                    singleTransactionPlan([instructionC]),
                ]),
            );
        });

        /**
         *  [Seq] ──────────────────────▶ [Seq]
         *   │                             │
         *   ├── [A: 100%]                 ├── [Tx: A]
         *   └── [NonDivSeq]               └── [NonDivSeq]
         *        ├── [B: 100%]                 ├── [Tx: B]
         *        └── [C: 100%]                 └── [Tx: C]
         */
        it('does not simplify non-divisible sequential plans inside divisible sequential plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(100));
            const instructionB = instruction('B', txPercent(100));
            const instructionC = instruction('C', txPercent(100));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionB),
                            singleInstructionPlan(instructionC),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([instructionA]),
                    nonDivisibleSequentialTransactionPlan([
                        singleTransactionPlan([instructionB]),
                        singleTransactionPlan([instructionC]),
                    ]),
                ]),
            );
        });

        /**
         *  [Par] ───────────────────▶ [Tx: A + B + C + D]
         *   │
         *   ├── [NonDivSeq]
         *   │    ├── [A: 25%]
         *   │    └── [B: 25%]
         *   └── [NonDivSeq]
         *        ├── [C: 25%]
         *        └── [D: 25%]
         */
        it('can merge non-divisible sequential plans in a parallel plan if the whole sequential plan fits', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(25));
            const instructionB = instruction('B', txPercent(25));
            const instructionC = instruction('C', txPercent(25));
            const instructionD = instruction('D', txPercent(25));

            await expect(
                planner(
                    parallelInstructionPlan([
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionC),
                            singleInstructionPlan(instructionD),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(singleTransactionPlan([instructionA, instructionB, instructionC, instructionD]));
        });

        /**
         *  [Par] ───────────────────▶ [Par]
         *   │                          │
         *   ├── [NonDivSeq]            ├── [Tx: A + B]
         *   │    ├── [A: 33%]          └── [Tx: C + D]
         *   │    └── [B: 33%]
         *   └── [NonDivSeq]
         *        ├── [C: 33%]
         *        └── [D: 33%]
         */
        it('does not split a non-divisible sequential plan on a parallel parent', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(33));
            const instructionB = instruction('B', txPercent(33));
            const instructionC = instruction('C', txPercent(33));
            const instructionD = instruction('D', txPercent(33));

            await expect(
                planner(
                    parallelInstructionPlan([
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionC),
                            singleInstructionPlan(instructionD),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                parallelTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    singleTransactionPlan([instructionC, instructionD]),
                ]),
            );
        });

        /**
         *  [Seq] ───────────────────▶ [Tx: A + B + C + D]
         *   │
         *   ├── [NonDivSeq]
         *   │    ├── [A: 25%]
         *   │    └── [B: 25%]
         *   └── [NonDivSeq]
         *        ├── [C: 25%]
         *        └── [D: 25%]
         */
        it('can merge non-divisible sequential plans in a sequential plan if the whole plan fits', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(25));
            const instructionB = instruction('B', txPercent(25));
            const instructionC = instruction('C', txPercent(25));
            const instructionD = instruction('D', txPercent(25));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionC),
                            singleInstructionPlan(instructionD),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(singleTransactionPlan([instructionA, instructionB, instructionC, instructionD]));
        });

        /**
         *  [Seq] ───────────────────▶ [Seq]
         *   │                          │
         *   ├── [NonDivSeq]            ├── [Tx: A + B]
         *   │    ├── [A: 33%]          └── [Tx: C + D]
         *   │    └── [B: 33%]
         *   └── [NonDivSeq]
         *        ├── [C: 33%]
         *        └── [D: 33%]
         */
        it('does not split a non-divisible sequential plan on a sequential parent', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(33));
            const instructionB = instruction('B', txPercent(33));
            const instructionC = instruction('C', txPercent(33));
            const instructionD = instruction('D', txPercent(33));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionC),
                            singleInstructionPlan(instructionD),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    singleTransactionPlan([instructionC, instructionD]),
                ]),
            );
        });

        /**
         *  [NonDivSeq] ─────────────▶ [NonDivSeq]
         *   │                          │
         *   ├── [Par]                  ├── [Tx: A + B]
         *   │    ├── [A: 50%]          └── [Par]
         *   │    └── [B: 50%]               ├── [Tx: C]
         *   └── [Par]                       └── [Tx: D]
         *        ├── [C: 100%]
         *        └── [D: 100%]
         */
        it('plans non-divisible sequentials plans with parallel children', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));
            const instructionC = instruction('C', txPercent(100));
            const instructionD = instruction('D', txPercent(100));

            await expect(
                planner(
                    nonDivisibleSequentialInstructionPlan([
                        parallelInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        parallelInstructionPlan([
                            singleInstructionPlan(instructionC),
                            singleInstructionPlan(instructionD),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                nonDivisibleSequentialTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    parallelTransactionPlan([
                        singleTransactionPlan([instructionC]),
                        singleTransactionPlan([instructionD]),
                    ]),
                ]),
            );
        });

        /**
         *  [NonDivSeq] ─────────────▶ [NonDivSeq]
         *   │                          │
         *   ├── [Seq]                  ├── [Tx: A + B]
         *   │    ├── [A: 50%]          ├── [Tx: C]
         *   │    └── [B: 50%]          └── [Tx: D]
         *   └── [Seq]
         *        ├── [C: 100%]
         *        └── [D: 100%]
         */
        it('plans non-divisible sequentials plans with divisible sequential children', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(50));
            const instructionB = instruction('B', txPercent(50));
            const instructionC = instruction('C', txPercent(100));
            const instructionD = instruction('D', txPercent(100));

            await expect(
                planner(
                    nonDivisibleSequentialInstructionPlan([
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionC),
                            singleInstructionPlan(instructionD),
                        ]),
                    ]),
                ),
            ).resolves.toEqual(
                nonDivisibleSequentialTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    singleTransactionPlan([instructionC]),
                    singleTransactionPlan([instructionD]),
                ]),
            );
        });
    });

    describe('message packer scenarios', () => {
        /**
         *  [A(x, 250%)] ─────────────▶ [Seq]
         *                               │
         *                               ├── [Tx: A(1, 100%)]
         *                               ├── [Tx: A(2, 100%)]
         *                               └── [Tx: A(3, 50%)]
         */
        it('iterate over message packer instruction plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const messagePackerIx = createMessagePackerInstructionPlan(txPercent(250));

            await expect(planner(messagePackerIx)).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([messagePackerIx.get(0, txPercent(100))]),
                    singleTransactionPlan([messagePackerIx.get(txPercent(100), txPercent(100))]),
                    singleTransactionPlan([messagePackerIx.get(txPercent(200), txPercent(50))]),
                ]),
            );
        });

        /**
         *  [Seq] ───────────────────▶ [Tx: A + B(1, 50%)]
         *   │
         *   ├── [A: 50%]
         *   └── [B(x, 50%)]
         */
        it('combines single instruction plans with message packer instruction plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });

            const instructionA = instruction('A', txPercent(50));
            const messagePackerB = createMessagePackerInstructionPlan(txPercent(50));

            await expect(
                planner(sequentialInstructionPlan([singleInstructionPlan(instructionA), messagePackerB])),
            ).resolves.toEqual(singleTransactionPlan([instructionA, messagePackerB.get(0, txPercent(50))]));
        });

        /**
         *  [Par] ────────────────────▶ [Par]
         *   │                           │
         *   └── [A(x, 250%)]            ├── [Tx: A(1, 100%)]
         *                               ├── [Tx: A(2, 100%)]
         *                               └── [Tx: A(3, 50%)]
         */
        it('can handle parallel message packer instruction plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const messagePackerA = createMessagePackerInstructionPlan(txPercent(250));

            await expect(planner(parallelInstructionPlan([messagePackerA]))).resolves.toEqual(
                parallelTransactionPlan([
                    singleTransactionPlan([messagePackerA.get(0, txPercent(100))]),
                    singleTransactionPlan([messagePackerA.get(txPercent(100), txPercent(100))]),
                    singleTransactionPlan([messagePackerA.get(txPercent(200), txPercent(50))]),
                ]),
            );
        });

        /**
         *  [NonDivSeq] ──────────────▶ [NonDivSeq]
         *   │                           │
         *   └── [A(x, 250%)]            ├── [Tx: A(1, 100%)]
         *                               ├── [Tx: A(2, 100%)]
         *                               └── [Tx: A(3, 50%)]
         */
        it('can handle non-divisible sequential message packer instruction plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const messagePackerA = createMessagePackerInstructionPlan(txPercent(250));

            await expect(planner(nonDivisibleSequentialInstructionPlan([messagePackerA]))).resolves.toEqual(
                nonDivisibleSequentialTransactionPlan([
                    singleTransactionPlan([messagePackerA.get(0, txPercent(100))]),
                    singleTransactionPlan([messagePackerA.get(txPercent(100), txPercent(100))]),
                    singleTransactionPlan([messagePackerA.get(txPercent(200), txPercent(50))]),
                ]),
            );
        });

        /**
         *  [A(x, 100%)] ─────────────▶ [Tx: A(1, 100%)]
         */
        it('simplifies message packer instruction plans that fit in a single transaction', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const messagePackerA = createMessagePackerInstructionPlan(txPercent(100));

            await expect(planner(messagePackerA)).resolves.toEqual(
                singleTransactionPlan([messagePackerA.get(0, txPercent(100))]),
            );
        });

        /**
         *  [Par] ─────────────────────▶ [Par]
         *   │                            │
         *   ├── [A: 75%]                 ├── [Tx: A + C(1, 25%)]
         *   ├── [B: 50%]                 ├── [Tx: B + C(2, 50%)]
         *   └── [C(x, 125%)]             └── [Tx: C(3, 50%)]
         */
        it('uses message packer instruction plans to fill gaps in parallel candidates', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });

            const instructionA = instruction('A', txPercent(75));
            const instructionB = instruction('B', txPercent(50));
            const messagePackerC = createMessagePackerInstructionPlan(txPercent(25) + txPercent(50) + txPercent(50)); // 125%

            await expect(
                planner(
                    parallelInstructionPlan([
                        singleInstructionPlan(instructionA),
                        singleInstructionPlan(instructionB),
                        messagePackerC,
                    ]),
                ),
            ).resolves.toEqual(
                parallelTransactionPlan([
                    singleTransactionPlan([instructionA, messagePackerC.get(0, txPercent(25))]),
                    singleTransactionPlan([instructionB, messagePackerC.get(txPercent(25), txPercent(50))]),
                    singleTransactionPlan([messagePackerC.get(txPercent(25) + txPercent(50), txPercent(50))]),
                ]),
            );
        });

        /**
         *  [Par] ─────────────────────▶ [Par]
         *   │                            │
         *   ├── [A(x, 125%)]             ├── [Tx: B + A(1, 25%)]
         *   ├── [C: 50%]                 ├── [Tx: C + A(2, 50%)]
         *   └── [B: 75%]                 └── [Tx: A(3, 50%)]
         */
        it('handles parallel message packer instruction plans last to fill gaps in previous parallel candidates', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });

            const messagePackerA = createMessagePackerInstructionPlan(txPercent(25) + txPercent(50) + txPercent(50)); // 125%
            const instructionB = instruction('B', txPercent(75));
            const instructionC = instruction('C', txPercent(50));

            await expect(
                planner(
                    parallelInstructionPlan([
                        messagePackerA,
                        singleInstructionPlan(instructionB),
                        singleInstructionPlan(instructionC),
                    ]),
                ),
            ).resolves.toEqual(
                parallelTransactionPlan([
                    singleTransactionPlan([instructionB, messagePackerA.get(0, txPercent(25))]),
                    singleTransactionPlan([instructionC, messagePackerA.get(txPercent(25), txPercent(50))]),
                    singleTransactionPlan([messagePackerA.get(txPercent(25) + txPercent(50), txPercent(50))]),
                ]),
            );
        });

        /**
         *  [Seq] ─────────────────────▶ [Seq]
         *   │                            │
         *   ├── [A: 75%]                 ├── [Tx: A + B(1, 25%)]
         *   ├── [B(x, 75%)]              └── [Tx: B(2, 50%) + C]
         *   └── [C: 50%]
         */
        it('uses message packer instruction plans to fill gaps in sequential candidates', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });

            const instructionA = instruction('A', txPercent(75));
            const messagePackerB = createMessagePackerInstructionPlan(txPercent(25) + txPercent(50)); // 75%
            const instructionC = instruction('C', txPercent(50));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        messagePackerB,
                        singleInstructionPlan(instructionC),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([instructionA, messagePackerB.get(0, txPercent(25))]),
                    singleTransactionPlan([messagePackerB.get(txPercent(25), txPercent(50)), instructionC]),
                ]),
            );
        });

        /**
         *  [NonDivSeq] ───────────────▶ [NonDivSeq]
         *   │                            │
         *   ├── [A: 75%]                 ├── [Tx: A + B(1, 25%)]
         *   ├── [B(x, 75%)]              └── [Tx: B(2, 50%) + C]
         *   └── [C: 50%]
         */
        it('uses message packer instruction plans to fill gaps in non-divisible sequential candidates', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });

            const instructionA = instruction('A', txPercent(75));
            const messagePackerB = createMessagePackerInstructionPlan(txPercent(25) + txPercent(50)); // 75%
            const instructionC = instruction('C', txPercent(50));

            await expect(
                planner(
                    nonDivisibleSequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        messagePackerB,
                        singleInstructionPlan(instructionC),
                    ]),
                ),
            ).resolves.toEqual(
                nonDivisibleSequentialTransactionPlan([
                    singleTransactionPlan([instructionA, messagePackerB.get(0, txPercent(25))]),
                    singleTransactionPlan([messagePackerB.get(txPercent(25), txPercent(50)), instructionC]),
                ]),
            );
        });

        /**
         *  [Seq] ───────────────────────▶ [Seq]
         *   │                              │
         *   ├── [A: 75%]                   ├── [Tx: A + B(1, 25%)]
         *   └── [Par]                      └── [Tx: C + B(2, 50%)]
         *        ├── [B(x, 75%)]
         *        └── [C: 50%]
         */
        it('uses parallel message packer instruction plans to fill gaps in sequential candidates', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });

            const instructionA = instruction('A', txPercent(75));
            const messagePackerB = createMessagePackerInstructionPlan(txPercent(25) + txPercent(50)); // 75%
            const instructionC = instruction('C', txPercent(50));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        parallelInstructionPlan([messagePackerB, singleInstructionPlan(instructionC)]),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([instructionA, messagePackerB.get(0, txPercent(25))]),
                    singleTransactionPlan([instructionC, messagePackerB.get(txPercent(25), txPercent(50))]),
                ]),
            );
        });

        /**
         *  [Par] ─────────────────────────▶ [Tx: A + B(1, 50%) + C]
         *   │
         *   ├── [A: 25%]
         *   └── [Seq]
         *        ├── [B(x, 50%)]
         *        └── [C: 25%]
         */
        it('uses the whole sequential message packer instruction plan when it fits in the parent parallel candidate', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });

            const instructionA = instruction('A', txPercent(25));
            const messagePackerB = createMessagePackerInstructionPlan(txPercent(50));
            const instructionC = instruction('C', txPercent(25));

            await expect(
                planner(
                    parallelInstructionPlan([
                        singleInstructionPlan(instructionA),
                        sequentialInstructionPlan([messagePackerB, singleInstructionPlan(instructionC)]),
                    ]),
                ),
            ).resolves.toEqual(
                singleTransactionPlan([instructionA, messagePackerB.get(0, txPercent(50)), instructionC]),
            );
        });

        /**
         *  [Seq] ─────────────────────────▶ [Tx: A + B(1, 50%) + C]
         *   │
         *   ├── [A: 25%]
         *   └── [NonDivSeq]
         *        ├── [B(x, 50%)]
         *        └── [C: 25%]
         */
        it('uses the whole non-divisible sequential message packer instruction plan when it fits in the parent sequential candidate', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });

            const instructionA = instruction('A', txPercent(25));
            const messagePackerB = createMessagePackerInstructionPlan(txPercent(50));
            const instructionC = instruction('C', txPercent(25));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        nonDivisibleSequentialInstructionPlan([messagePackerB, singleInstructionPlan(instructionC)]),
                    ]),
                ),
            ).resolves.toEqual(
                singleTransactionPlan([instructionA, messagePackerB.get(0, txPercent(50)), instructionC]),
            );
        });
    });

    describe('complex scenarios', () => {
        /**
         *  [Par] ───────────────────────────▶ [Par]
         *   │                                 │
         *   ├── [Seq]                         ├── [Tx: A + B]
         *   │    ├── [A: 40%]                 └── [NonDivSeq]
         *   │    └── [B: 40%]                      ├── [Tx: C + D + E + G]
         *   ├── [NonDivSeq]                        └── [Tx: F]
         *   │    ├── [Par]
         *   │    │    ├── [C: 25%]
         *   │    │    └── [D: 25%]
         *   │    └── [Par]
         *   │         ├── [E: 25%]
         *   │         └── [F: 50%]
         *   └── [G: 25%]
         */
        it('can plan complex scenarios (1)', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const instructionA = instruction('A', txPercent(40));
            const instructionB = instruction('B', txPercent(40));
            const instructionC = instruction('C', txPercent(25));
            const instructionD = instruction('D', txPercent(25));
            const instructionE = instruction('E', txPercent(25));
            const instructionF = instruction('F', txPercent(50));
            const instructionG = instruction('G', txPercent(25));

            await expect(
                planner(
                    parallelInstructionPlan([
                        sequentialInstructionPlan([
                            singleInstructionPlan(instructionA),
                            singleInstructionPlan(instructionB),
                        ]),
                        nonDivisibleSequentialInstructionPlan([
                            parallelInstructionPlan([
                                singleInstructionPlan(instructionC),
                                singleInstructionPlan(instructionD),
                            ]),
                            parallelInstructionPlan([
                                singleInstructionPlan(instructionE),
                                singleInstructionPlan(instructionF),
                            ]),
                        ]),
                        singleInstructionPlan(instructionG),
                    ]),
                ),
            ).resolves.toEqual(
                parallelTransactionPlan([
                    singleTransactionPlan([instructionA, instructionB]),
                    nonDivisibleSequentialTransactionPlan([
                        singleTransactionPlan([instructionC, instructionD, instructionE, instructionG]),
                        singleTransactionPlan([instructionF]),
                    ]),
                ]),
            );
        });

        /**
         *  [Seq] ─────────────────────────────────▶ [Seq]
         *   │                                        │
         *   ├── [A: 20%]                             ├── [Tx: A + B + C + E(1, 40%)]
         *   ├── [NonDivSeq]                          ├── [Par]
         *   │    ├── [B: 20%]                        │    ├── [Tx: D + E(2, 50%)]
         *   │    └── [C: 20%]                        │    ├── [Tx: E(3, 100%)]
         *   ├── [Par]                                │    └── [Tx: E(4, 60%)]
         *   │    ├── [D: 50%]                        └── [Tx: F + G]
         *   │    └── [E(x, 250%)]
         *   ├── [F: 50%]
         *   └── [G: 50%]
         */
        it('can plan complex scenarios (2)', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, singleTransactionPlan, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });

            const instructionA = instruction('A', txPercent(20));
            const instructionB = instruction('B', txPercent(20));
            const instructionC = instruction('C', txPercent(20));
            const instructionD = instruction('D', txPercent(50));
            const messagePackerE = createMessagePackerInstructionPlan(txPercent(250));
            const instructionF = instruction('F', txPercent(50));
            const instructionG = instruction('G', txPercent(50));

            await expect(
                planner(
                    sequentialInstructionPlan([
                        singleInstructionPlan(instructionA),
                        nonDivisibleSequentialInstructionPlan([
                            singleInstructionPlan(instructionB),
                            singleInstructionPlan(instructionC),
                        ]),
                        parallelInstructionPlan([singleInstructionPlan(instructionD), messagePackerE]),
                        singleInstructionPlan(instructionF),
                        singleInstructionPlan(instructionG),
                    ]),
                ),
            ).resolves.toEqual(
                sequentialTransactionPlan([
                    singleTransactionPlan([
                        instructionA,
                        instructionB,
                        instructionC,
                        messagePackerE.get(0, txPercent(40) - 3),
                    ]),
                    parallelTransactionPlan([
                        singleTransactionPlan([instructionD, messagePackerE.get(txPercent(40) - 3, txPercent(50))]),
                        singleTransactionPlan([messagePackerE.get(txPercent(40) - 3 + txPercent(50), txPercent(100))]),
                        singleTransactionPlan([
                            messagePackerE.get(txPercent(40) - 3 + txPercent(50) + txPercent(100), txPercent(60) + 3),
                        ]),
                    ]),
                    singleTransactionPlan([instructionF, instructionG]),
                ]),
            );
        });
    });

    describe('freezability', () => {
        it('freezes single transaction plans', async () => {
            expect.assertions(1);
            const instruction = instructionFactory();
            const planner = createTransactionPlanner({ createTransactionMessage: createMockTransactionMessage });
            const plan = (await planner(singleInstructionPlan(instruction('A', 42)))) as SingleTransactionPlan;
            expect(plan).toBeFrozenObject();
        });

        it('freezes messages inside single transaction plans', async () => {
            expect.assertions(1);
            const instruction = instructionFactory();
            const planner = createTransactionPlanner({ createTransactionMessage: createMockTransactionMessage });
            const plan = (await planner(singleInstructionPlan(instruction('A', 42)))) as SingleTransactionPlan;
            expect(plan.message).toBeFrozenObject();
        });

        it('freezes sequential transaction plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const plan = (await planner(
                sequentialInstructionPlan([instruction('A', txPercent(100)), instruction('B', txPercent(100))]),
            )) as SequentialTransactionPlan;
            expect(plan).toBeFrozenObject();
        });

        it('freezes the children of sequential transaction plans', async () => {
            expect.assertions(2);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const plan = (await planner(
                sequentialInstructionPlan([instruction('A', txPercent(100)), instruction('B', txPercent(100))]),
            )) as SequentialTransactionPlan;
            expect(plan.plans[0]).toBeFrozenObject();
            expect(plan.plans[1]).toBeFrozenObject();
        });

        it('freezes non-divisible sequential transaction plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const plan = (await planner(
                nonDivisibleSequentialInstructionPlan([
                    instruction('A', txPercent(100)),
                    instruction('B', txPercent(100)),
                ]),
            )) as SequentialTransactionPlan & { divisible: false };
            expect(plan).toBeFrozenObject();
        });

        it('freezes the children of non-divisible sequential transaction plans', async () => {
            expect.assertions(2);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const plan = (await planner(
                nonDivisibleSequentialInstructionPlan([
                    instruction('A', txPercent(100)),
                    instruction('B', txPercent(100)),
                ]),
            )) as SequentialTransactionPlan & { divisible: false };
            expect(plan.plans[0]).toBeFrozenObject();
            expect(plan.plans[1]).toBeFrozenObject();
        });

        it('freezes parallel transaction plans', async () => {
            expect.assertions(1);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const plan = (await planner(
                parallelInstructionPlan([instruction('A', txPercent(100)), instruction('B', txPercent(100))]),
            )) as ParallelTransactionPlan;
            expect(plan).toBeFrozenObject();
        });

        it('freezes the children of parallel transaction plans', async () => {
            expect.assertions(2);
            const createTransactionMessage = createMockTransactionMessage;
            const { instruction, txPercent } = getHelpers(createTransactionMessage);
            const planner = createTransactionPlanner({ createTransactionMessage });
            const plan = (await planner(
                parallelInstructionPlan([instruction('A', txPercent(100)), instruction('B', txPercent(100))]),
            )) as ParallelTransactionPlan;
            expect(plan.plans[0]).toBeFrozenObject();
            expect(plan.plans[1]).toBeFrozenObject();
        });
    });

    describe('abort signals', () => {
        function runAndAbortPlanner(planner: TransactionPlanner, plan?: InstructionPlan): Promise<TransactionPlan> {
            const abortController = new AbortController();
            const promise = planner(plan ?? singleInstructionPlan(instructionFactory()('A', 42)), {
                abortSignal: abortController.signal,
            });
            abortController.abort();
            return promise;
        }

        it('can abort the planner should `createTransactionMessage` never resolve', async () => {
            expect.assertions(1);
            const foreverCreateMessage = jest.fn().mockReturnValue(FOREVER_PROMISE);
            const planner = createTransactionPlanner({ createTransactionMessage: foreverCreateMessage });

            const promise = runAndAbortPlanner(planner);
            await expect(promise).rejects.toThrow('aborted');
        });

        it('can abort the planner should `onTransactionMessageUpdated` never resolve', async () => {
            expect.assertions(1);
            const foreverOnMessageUpdated = jest.fn().mockReturnValue(FOREVER_PROMISE);
            const planner = createTransactionPlanner({
                createTransactionMessage: createMockTransactionMessage,
                onTransactionMessageUpdated: foreverOnMessageUpdated,
            });

            const promise = runAndAbortPlanner(planner);
            await expect(promise).rejects.toThrow('aborted');
        });

        it('does not continue execution after being aborted in `createTransactionMessage` function', async () => {
            expect.assertions(1);
            const foreverCreateMessage = jest.fn().mockReturnValue(FOREVER_PROMISE);
            const onMessageUpdated = jest.fn();
            const planner = createTransactionPlanner({
                createTransactionMessage: foreverCreateMessage,
                onTransactionMessageUpdated: onMessageUpdated,
            });

            await runAndAbortPlanner(planner).catch(() => {});
            expect(onMessageUpdated).not.toHaveBeenCalled();
        });

        it('does not continue execution after being aborted in `onTransactionMessageUpdated` function', async () => {
            expect.assertions(1);
            const createMessage = jest.fn();
            const foreverOnMessageUpdated = jest.fn().mockReturnValue(FOREVER_PROMISE);
            const planner = createTransactionPlanner({
                createTransactionMessage: createMessage,
                onTransactionMessageUpdated: foreverOnMessageUpdated,
            });

            await runAndAbortPlanner(planner).catch(() => {});
            expect(createMessage).toHaveBeenCalledTimes(1);
        });
    });
});
