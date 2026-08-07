import type {
    InstructionPlanInput,
    SingleTransactionPlan,
    SuccessfulSingleTransactionPlanResult,
    TransactionPlan,
    TransactionPlanInput,
    TransactionPlanResult,
    TransactionPlanResultContext,
    TransactionPlanResultContextWithSignature,
} from '@solana/instruction-plans';
import type { Signature } from '@solana/keys';
import type { Transaction } from '@solana/transactions';

import type {
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

    // The default context guarantees a signature on successful results.
    {
        type Result = Awaited<ReturnType<ClientWithTransactionSending['sendTransaction']>>;
        const result = null as unknown as Result;
        result.context.signature satisfies Signature;
    }

    // A custom context propagates to the results of both methods.
    {
        type CustomContext = TransactionPlanResultContextWithSignature & { slot: bigint };
        const client = null as unknown as ClientWithTransactionSending<CustomContext>;
        const input = null as unknown as InstructionPlanInput;
        void (client.sendTransaction(input) satisfies Promise<SuccessfulSingleTransactionPlanResult<CustomContext>>);
        void (client.sendTransactions(input) satisfies Promise<TransactionPlanResult<CustomContext>>);

        const result = null as unknown as Awaited<ReturnType<(typeof client)['sendTransaction']>>;
        result.context.slot satisfies bigint;
    }

    // A client with a richer context satisfies the default interface.
    {
        type CustomContext = TransactionPlanResultContextWithSignature & { slot: bigint };
        const client = null as unknown as ClientWithTransactionSending<CustomContext>;
        client satisfies ClientWithTransactionSending;
    }

    // A client whose context drops the signature does not satisfy the default interface.
    {
        type CustomContext = TransactionPlanResultContext & { signature?: Signature };
        const client = null as unknown as ClientWithTransactionSending<CustomContext>;
        // @ts-expect-error The default interface guarantees a signature on successful results.
        client satisfies ClientWithTransactionSending;
    }
}

// [DESCRIBE] ClientWithTransactionSigning.
{
    // signTransaction accepts InstructionPlanInput.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const input = null as unknown as InstructionPlanInput;
        void (client.signTransaction(input) satisfies Promise<
            SuccessfulSingleTransactionPlanResult<TransactionPlanResultContext>
        >);
    }

    // signTransaction accepts SingleTransactionPlan.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const plan = null as unknown as SingleTransactionPlan;
        void (client.signTransaction(plan) satisfies Promise<
            SuccessfulSingleTransactionPlanResult<TransactionPlanResultContext>
        >);
    }

    // signTransaction accepts SingleTransactionPlan['message'].
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const message = null as unknown as SingleTransactionPlan['message'];
        void (client.signTransaction(message) satisfies Promise<
            SuccessfulSingleTransactionPlanResult<TransactionPlanResultContext>
        >);
    }

    // signTransactions accepts InstructionPlanInput.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const input = null as unknown as InstructionPlanInput;
        void (client.signTransactions(input) satisfies Promise<TransactionPlanResult<TransactionPlanResultContext>>);
    }

    // signTransactions accepts TransactionPlanInput.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const input = null as unknown as TransactionPlanInput;
        void (client.signTransactions(input) satisfies Promise<TransactionPlanResult<TransactionPlanResultContext>>);
    }

    // Both methods accept an optional config with abortSignal.
    {
        const client = null as unknown as ClientWithTransactionSigning;
        const input = null as unknown as InstructionPlanInput;
        const abortController = new AbortController();
        void (client.signTransaction(input, {
            abortSignal: abortController.signal,
        }) satisfies Promise<SuccessfulSingleTransactionPlanResult<TransactionPlanResultContext>>);
        void (client.signTransactions(input, {
            abortSignal: abortController.signal,
        }) satisfies Promise<TransactionPlanResult<TransactionPlanResultContext>>);
    }

    // The default context makes no guarantees about its contents.
    {
        type Result = Awaited<ReturnType<ClientWithTransactionSigning['signTransaction']>>;
        const result = null as unknown as Result;
        result.context.transaction satisfies unknown;
        // @ts-expect-error The bare interface does not guarantee a transaction.
        result.context.transaction satisfies Transaction;
        // @ts-expect-error The bare interface does not guarantee a signature.
        result.context.signature satisfies Signature;
    }

    // A custom context propagates to the results of both methods.
    {
        type CustomContext = { transaction: Transaction };
        const client = null as unknown as ClientWithTransactionSigning<CustomContext>;
        const input = null as unknown as InstructionPlanInput;
        void (client.signTransaction(input) satisfies Promise<SuccessfulSingleTransactionPlanResult<CustomContext>>);
        void (client.signTransactions(input) satisfies Promise<TransactionPlanResult<CustomContext>>);

        const result = null as unknown as Awaited<ReturnType<(typeof client)['signTransaction']>>;
        result.context.transaction satisfies Transaction;
    }

    // A client with a richer context satisfies the bare interface.
    {
        type CustomContext = { transaction: Transaction };
        const client = null as unknown as ClientWithTransactionSigning<CustomContext>;
        client satisfies ClientWithTransactionSigning;
    }

    // A ClientWithTransactionSending's methods satisfy the bare signing methods, since the bare
    // signing interface makes no guarantees about the result context.
    {
        const sendingClient = null as unknown as ClientWithTransactionSending;
        sendingClient.sendTransaction satisfies ClientWithTransactionSigning['signTransaction'];
        sendingClient.sendTransactions satisfies ClientWithTransactionSigning['signTransactions'];
    }

    // A ClientWithTransactionSending's methods do not satisfy a signing interface whose context
    // guarantees the transaction is retained, since sending results type it as optional.
    {
        const sendingClient = null as unknown as ClientWithTransactionSending;
        type SigningClient = ClientWithTransactionSigning<{ transaction: Transaction }>;
        // @ts-expect-error The transaction is not guaranteed on a sending result.
        sendingClient.sendTransaction satisfies SigningClient['signTransaction'];
        // @ts-expect-error The transaction is not guaranteed on a sending result.
        sendingClient.sendTransactions satisfies SigningClient['signTransactions'];
    }
}

// [DESCRIBE] Combining ClientWithTransactionPlanning, ClientWithTransactionSending and ClientWithTransactionSigning.
{
    // They can be combined into a single client type.
    {
        type FullTransactionClient = ClientWithTransactionPlanning &
            ClientWithTransactionSending &
            ClientWithTransactionSigning;
        const client = null as unknown as FullTransactionClient;

        client.planTransaction satisfies ClientWithTransactionPlanning['planTransaction'];
        client.planTransactions satisfies ClientWithTransactionPlanning['planTransactions'];
        client.sendTransaction satisfies ClientWithTransactionSending['sendTransaction'];
        client.sendTransactions satisfies ClientWithTransactionSending['sendTransactions'];
        client.signTransaction satisfies ClientWithTransactionSigning['signTransaction'];
        client.signTransactions satisfies ClientWithTransactionSigning['signTransactions'];
    }
}
