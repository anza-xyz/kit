import type {
    InstructionPlan,
    SingleInstructionPlan,
    SingleTransactionPlan,
    SuccessfulSingleTransactionPlanResult,
    TransactionPlan,
    TransactionPlanResult,
} from '@solana/instruction-plans';
import type { Instruction } from '@solana/instructions';
import type { ClientWithTransactionPlanning, ClientWithTransactionSending } from '@solana/plugin-interfaces';

import { addSelfPlanAndSendFunctions, type SelfPlanAndSendFunctions } from '../index';

type FullClient = ClientWithTransactionPlanning & ClientWithTransactionSending;

// [DESCRIBE] SelfPlanAndSendFunctions.
{
    // It provides a planTransaction method that returns a promise of a transaction message.
    {
        const self = null as unknown as SelfPlanAndSendFunctions;
        void (self.planTransaction() satisfies Promise<SingleTransactionPlan['message']>);
    }

    // It provides a planTransactions method that returns a promise of a transaction plan.
    {
        const self = null as unknown as SelfPlanAndSendFunctions;
        void (self.planTransactions() satisfies Promise<TransactionPlan>);
    }

    // It provides a sendTransaction method that returns a promise of a single successful result.
    {
        const self = null as unknown as SelfPlanAndSendFunctions;
        void (self.sendTransaction() satisfies Promise<SuccessfulSingleTransactionPlanResult>);
    }

    // It provides a sendTransactions method that returns a promise of a transaction plan result.
    {
        const self = null as unknown as SelfPlanAndSendFunctions;
        void (self.sendTransactions() satisfies Promise<TransactionPlanResult>);
    }

    // All methods accept an optional config with abortSignal.
    {
        const self = null as unknown as SelfPlanAndSendFunctions;
        const abortController = new AbortController();
        void (self.planTransaction({
            abortSignal: abortController.signal,
        }) satisfies Promise<SingleTransactionPlan['message']>);
        void (self.planTransactions({
            abortSignal: abortController.signal,
        }) satisfies Promise<TransactionPlan>);
        void (self.sendTransaction({
            abortSignal: abortController.signal,
        }) satisfies Promise<SuccessfulSingleTransactionPlanResult>);
        void (self.sendTransactions({
            abortSignal: abortController.signal,
        }) satisfies Promise<TransactionPlanResult>);
    }
}

// [DESCRIBE] addSelfPlanAndSendFunctions.
{
    // It returns an Instruction with SelfPlanAndSendFunctions when given an Instruction.
    {
        const client = null as unknown as FullClient;
        const instruction = null as unknown as Instruction;
        const result = addSelfPlanAndSendFunctions(client, instruction);
        result satisfies Instruction & SelfPlanAndSendFunctions;
    }

    // It returns an InstructionPlan with SelfPlanAndSendFunctions when given an InstructionPlan.
    {
        const client = null as unknown as FullClient;
        const plan = null as unknown as InstructionPlan;
        const result = addSelfPlanAndSendFunctions(client, plan);
        result satisfies InstructionPlan & SelfPlanAndSendFunctions;
    }

    // It returns a PromiseLike<Instruction> with SelfPlanAndSendFunctions when given a PromiseLike<Instruction>.
    {
        const client = null as unknown as FullClient;
        const instructionPromise = null as unknown as PromiseLike<Instruction>;
        const result = addSelfPlanAndSendFunctions(client, instructionPromise);
        result satisfies PromiseLike<Instruction> & SelfPlanAndSendFunctions;
    }

    // It returns a PromiseLike<InstructionPlan> with SelfPlanAndSendFunctions when given a PromiseLike<InstructionPlan>.
    {
        const client = null as unknown as FullClient;
        const planPromise = null as unknown as PromiseLike<InstructionPlan>;
        const result = addSelfPlanAndSendFunctions(client, planPromise);
        result satisfies PromiseLike<InstructionPlan> & SelfPlanAndSendFunctions;
    }

    // It preserves the specific instruction type.
    {
        type MyInstruction = Instruction<'MyProgram111111111111111111111111'> & { custom: 42 };
        const client = null as unknown as FullClient;
        const instruction = null as unknown as MyInstruction;
        const result = addSelfPlanAndSendFunctions(client, instruction);
        result satisfies MyInstruction;
    }

    // It preserves the specific instruction plan type.
    {
        type MyPlan = SingleInstructionPlan & { custom: 42 };
        const client = null as unknown as FullClient;
        const plan = null as unknown as MyPlan;
        const result = addSelfPlanAndSendFunctions(client, plan);
        result satisfies MyPlan;
    }

    // It preserves the Promise type with specific instruction.
    {
        type MyInstruction = Instruction<'MyProgram111111111111111111111111'>;
        const client = null as unknown as FullClient;
        const instructionPromise = null as unknown as Promise<MyInstruction>;
        const result = addSelfPlanAndSendFunctions(client, instructionPromise);
        void (result satisfies Promise<MyInstruction>);
    }
}
