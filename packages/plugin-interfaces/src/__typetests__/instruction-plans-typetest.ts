import type {
    InstructionPlanInput,
    SingleTransactionPlan,
    SuccessfulSingleTransactionPlanResult,
    SuccessfulSingleTransactionPlanResultWithTransaction,
    TransactionPlan,
    TransactionPlanInput,
    TransactionPlanResult,
    TransactionPlanResultWithTransactions,
} from '@solana/instruction-plans';

import type {
    ClientWithSignedTransactionSending,
    ClientWithTransactionPlanning,
    ClientWithTransactionSending,
    ClientWithTransactionSigning,
} from '../instruction-plans';

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

// [DESCRIBE] ClientWithTransactionSigning.
{
    // signTransaction accepts InstructionPlanInput.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const input = null as unknown as InstructionPlanInput;
        void (client.signTransaction(input) satisfies Promise<SuccessfulSingleTransactionPlanResultWithTransaction>);
    }

    // signTransaction accepts SingleTransactionPlan.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const plan = null as unknown as SingleTransactionPlan;
        void (client.signTransaction(plan) satisfies Promise<SuccessfulSingleTransactionPlanResultWithTransaction>);
    }

    // signTransaction accepts SingleTransactionPlan['message'].
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const message = null as unknown as SingleTransactionPlan['message'];
        void (client.signTransaction(message) satisfies Promise<SuccessfulSingleTransactionPlanResultWithTransaction>);
    }

    // signTransaction resolves with a result that satisfies the sending result type.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const input = null as unknown as InstructionPlanInput;
        void (client.signTransaction(input) satisfies Promise<SuccessfulSingleTransactionPlanResult>);
    }

    // signTransactions accepts InstructionPlanInput.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const input = null as unknown as InstructionPlanInput;
        void (client.signTransactions(input) satisfies Promise<TransactionPlanResultWithTransactions>);
    }

    // signTransactions accepts TransactionPlanInput.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const input = null as unknown as TransactionPlanInput;
        void (client.signTransactions(input) satisfies Promise<TransactionPlanResultWithTransactions>);
    }

    // Both methods accept an optional config with abortSignal.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const input = null as unknown as InstructionPlanInput;
        const abortController = new AbortController();
        void (client.signTransaction(input, {
            abortSignal: abortController.signal,
        }) satisfies Promise<SuccessfulSingleTransactionPlanResultWithTransaction>);
        void (client.signTransactions(input, {
            abortSignal: abortController.signal,
        }) satisfies Promise<TransactionPlanResultWithTransactions>);
    }
}

// [DESCRIBE] ClientWithSignedTransactionSending.
{
    // sendSignedTransaction accepts a SuccessfulSingleTransactionPlanResultWithTransaction.
    {
        const client = null as unknown as ClientWithSignedTransactionSending;
        const result = null as unknown as SuccessfulSingleTransactionPlanResultWithTransaction;
        void (client.sendSignedTransaction(result) satisfies Promise<SuccessfulSingleTransactionPlanResult>);
    }

    // sendSignedTransaction rejects a result with no guaranteed transaction.
    {
        const client = null as unknown as ClientWithSignedTransactionSending;
        const result = null as unknown as SuccessfulSingleTransactionPlanResult;
        // @ts-expect-error A plain successful result does not guarantee a transaction to send.
        void client.sendSignedTransaction(result);
    }

    // sendSignedTransactions accepts a TransactionPlanResultWithTransactions.
    {
        const client = null as unknown as ClientWithSignedTransactionSending;
        const result = null as unknown as TransactionPlanResultWithTransactions;
        void (client.sendSignedTransactions(result) satisfies Promise<TransactionPlanResult>);
    }

    // sendSignedTransactions rejects a plain transaction plan result.
    {
        const client = null as unknown as ClientWithSignedTransactionSending;
        const result = null as unknown as TransactionPlanResult;
        // @ts-expect-error Successful leaves are not guaranteed to carry a transaction to send.
        void client.sendSignedTransactions(result);
    }

    // Both methods accept an optional config with abortSignal.
    {
        const client = null as unknown as ClientWithSignedTransactionSending;
        const single = null as unknown as SuccessfulSingleTransactionPlanResultWithTransaction;
        const plural = null as unknown as TransactionPlanResultWithTransactions;
        const abortController = new AbortController();
        void (client.sendSignedTransaction(single, {
            abortSignal: abortController.signal,
        }) satisfies Promise<SuccessfulSingleTransactionPlanResult>);
        void (client.sendSignedTransactions(plural, {
            abortSignal: abortController.signal,
        }) satisfies Promise<TransactionPlanResult>);
    }
}

// [DESCRIBE] Signing then sending signed transactions.
{
    // A signed single result flows from signTransaction into sendSignedTransaction.
    {
        type SigningClient = ClientWithSignedTransactionSending & ClientWithTransactionSigning;
        const client = null as unknown as SigningClient;
        const input = null as unknown as InstructionPlanInput;
        void (async () => {
            const signed = await client.signTransaction(input);
            void (await client.sendSignedTransaction(signed));
        });
    }

    // A signed plural result flows from signTransactions into sendSignedTransactions.
    {
        type SigningClient = ClientWithSignedTransactionSending & ClientWithTransactionSigning;
        const client = null as unknown as SigningClient;
        const input = null as unknown as InstructionPlanInput;
        void (async () => {
            const signed = await client.signTransactions(input);
            void (await client.sendSignedTransactions(signed));
        });
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

    // All four transaction capabilities can be combined into a single client type.
    {
        type FullTransactionClient = ClientWithSignedTransactionSending &
            ClientWithTransactionPlanning &
            ClientWithTransactionSending &
            ClientWithTransactionSigning;
        const client = null as unknown as FullTransactionClient;

        client.planTransaction satisfies ClientWithTransactionPlanning['planTransaction'];
        client.sendTransaction satisfies ClientWithTransactionSending['sendTransaction'];
        client.signTransaction satisfies ClientWithTransactionSigning['signTransaction'];
        client.signTransactions satisfies ClientWithTransactionSigning['signTransactions'];
        client.sendSignedTransaction satisfies ClientWithSignedTransactionSending['sendSignedTransaction'];
        client.sendSignedTransactions satisfies ClientWithSignedTransactionSending['sendSignedTransactions'];
    }
}
