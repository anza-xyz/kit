import type {
    InstructionPlanInput,
    SingleTransactionPlan,
    SuccessfulSingleTransactionPlanResult,
    TransactionPlan,
    TransactionPlanInput,
    TransactionPlanResult,
} from '@solana/instruction-plans';

import type { ClientWithTransactionPlanning, ClientWithTransactionSending } from '../instruction-plans';

// [DESCRIBE] ClientWithTransactionPlanning.
{
    // It provides a planTransaction method that returns a transaction message.
    {
        const client = null as unknown as ClientWithTransactionPlanning;
        const input = null as unknown as InstructionPlanInput;
        void (client.planTransaction(input) satisfies Promise<SingleTransactionPlan['message']>);
    }

    // It provides a planTransactions method that returns a transaction plan.
    {
        const client = null as unknown as ClientWithTransactionPlanning;
        const input = null as unknown as InstructionPlanInput;
        void (client.planTransactions(input) satisfies Promise<TransactionPlan>);
    }

    // Both methods accept an optional config with abortSignal.
    {
        const client = null as unknown as ClientWithTransactionPlanning;
        const input = null as unknown as InstructionPlanInput;
        const abortController = new AbortController();
        void (client.planTransaction(input, {
            abortSignal: abortController.signal,
        }) satisfies Promise<SingleTransactionPlan['message']>);
        void (client.planTransactions(input, {
            abortSignal: abortController.signal,
        }) satisfies Promise<TransactionPlan>);
    }
}

// [DESCRIBE] ClientWithTransactionSending.
{
    // sendTransaction accepts InstructionPlanInput.
    {
        const client = null as unknown as ClientWithTransactionSending;
        const input = null as unknown as InstructionPlanInput;
        void (client.sendTransaction(input) satisfies Promise<SuccessfulSingleTransactionPlanResult>);
    }

    // sendTransaction accepts SingleTransactionPlan.
    {
        const client = null as unknown as ClientWithTransactionSending;
        const plan = null as unknown as SingleTransactionPlan;
        void (client.sendTransaction(plan) satisfies Promise<SuccessfulSingleTransactionPlanResult>);
    }

    // sendTransaction accepts SingleTransactionPlan['message'].
    {
        const client = null as unknown as ClientWithTransactionSending;
        const message = null as unknown as SingleTransactionPlan['message'];
        void (client.sendTransaction(message) satisfies Promise<SuccessfulSingleTransactionPlanResult>);
    }

    // sendTransactions accepts InstructionPlanInput.
    {
        const client = null as unknown as ClientWithTransactionSending;
        const input = null as unknown as InstructionPlanInput;
        void (client.sendTransactions(input) satisfies Promise<TransactionPlanResult>);
    }

    // sendTransactions accepts TransactionPlanInput.
    {
        const client = null as unknown as ClientWithTransactionSending;
        const input = null as unknown as TransactionPlanInput;
        void (client.sendTransactions(input) satisfies Promise<TransactionPlanResult>);
    }

    // Both methods accept an optional config with abortSignal.
    {
        const client = null as unknown as ClientWithTransactionSending;
        const input = null as unknown as InstructionPlanInput;
        const abortController = new AbortController();
        void (client.sendTransaction(input, {
            abortSignal: abortController.signal,
        }) satisfies Promise<SuccessfulSingleTransactionPlanResult>);
        void (client.sendTransactions(input, {
            abortSignal: abortController.signal,
        }) satisfies Promise<TransactionPlanResult>);
    }
}

// [DESCRIBE] Combining ClientWithTransactionPlanning and ClientWithTransactionSending.
{
    // They can be combined into a single client type.
    {
        type FullTransactionClient = ClientWithTransactionPlanning & ClientWithTransactionSending;
        const client = null as unknown as FullTransactionClient;

        client.planTransaction satisfies ClientWithTransactionPlanning['planTransaction'];
        client.planTransactions satisfies ClientWithTransactionPlanning['planTransactions'];
        client.sendTransaction satisfies ClientWithTransactionSending['sendTransaction'];
        client.sendTransactions satisfies ClientWithTransactionSending['sendTransactions'];
    }
}
