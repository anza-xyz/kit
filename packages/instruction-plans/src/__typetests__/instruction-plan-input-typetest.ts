import type { Instruction } from '@solana/instructions';
import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';

import { InstructionPlan, parseInstructionPlanInput, parseTransactionPlanInput, TransactionPlan } from '../index';

const instructionPlanA = null as unknown as InstructionPlan & { id: 'A' };
const instructionPlanB = null as unknown as InstructionPlan & { id: 'B' };
const instructionA = null as unknown as Instruction & { id: 'A' };
const instructionB = null as unknown as Instruction & { id: 'B' };

const transactionPlanA = null as unknown as TransactionPlan & { id: 'A' };
const transactionPlanB = null as unknown as TransactionPlan & { id: 'B' };
const messageA = null as unknown as TransactionMessage & TransactionMessageWithFeePayer & { id: 'A' };
const messageB = null as unknown as TransactionMessage & TransactionMessageWithFeePayer & { id: 'B' };

// [DESCRIBE] parseInstructionPlanInput
{
    // It parses a single Instruction.
    {
        const plan = parseInstructionPlanInput(instructionA);
        plan satisfies InstructionPlan;
    }

    // It parses an InstructionPlan.
    {
        const plan = parseInstructionPlanInput(instructionPlanA);
        plan satisfies InstructionPlan;
    }

    // It parses an array of Instructions.
    {
        const plan = parseInstructionPlanInput([instructionA, instructionB]);
        plan satisfies InstructionPlan;
    }

    // It parses an array of InstructionPlans.
    {
        const plan = parseInstructionPlanInput([instructionPlanA, instructionPlanB]);
        plan satisfies InstructionPlan;
    }

    // It parses an array of mixed Instructions and InstructionPlans.
    {
        const plan = parseInstructionPlanInput([instructionA, instructionPlanA, instructionB, instructionPlanB]);
        plan satisfies InstructionPlan;
    }

    // It parses an empty array.
    {
        const plan = parseInstructionPlanInput([]);
        plan satisfies InstructionPlan;
    }
}

// [DESCRIBE] parseTransactionPlanInput
{
    // It parses a single TransactionMessage & TransactionMessageWithFeePayer.
    {
        const plan = parseTransactionPlanInput(messageA);
        plan satisfies TransactionPlan;
    }

    // It requires a fee payer.
    {
        const messageWithoutFeePayer = null as unknown as TransactionMessage;
        // @ts-expect-error Missing fee payer.
        parseTransactionPlanInput(messageWithoutFeePayer);
    }

    // It parses an InstructionPlan.
    {
        const plan = parseTransactionPlanInput(transactionPlanA);
        plan satisfies TransactionPlan;
    }

    // It parses an array of Instructions.
    {
        const plan = parseTransactionPlanInput([messageA, messageB]);
        plan satisfies TransactionPlan;
    }

    // It parses an array of InstructionPlans.
    {
        const plan = parseTransactionPlanInput([transactionPlanA, transactionPlanB]);
        plan satisfies TransactionPlan;
    }

    // It parses an array of mixed Instructions and InstructionPlans.
    {
        const plan = parseTransactionPlanInput([messageA, transactionPlanA, messageB, transactionPlanB]);
        plan satisfies TransactionPlan;
    }

    // It parses an empty array.
    {
        const plan = parseTransactionPlanInput([]);
        plan satisfies TransactionPlan;
    }
}
