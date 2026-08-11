import {
    createFailedToExecuteTransactionPlanError,
    createFailedToSendTransactionError,
    createFailedToSendTransactionsError,
    FailedSingleTransactionPlanResult,
    type TransactionPlanResult,
} from '../index';

// [DESCRIBE] createFailedToSendTransactionError
{
    // It accepts a result carrying an entirely custom context, which makes no promise about the
    // signature it reads to build its message.
    {
        const result = null as unknown as FailedSingleTransactionPlanResult<{ custom: string }>;
        createFailedToSendTransactionError(result);
    }
}

// [DESCRIBE] createFailedToSendTransactionsError
{
    // It accepts a result tree carrying an entirely custom context.
    {
        const result = null as unknown as TransactionPlanResult<{ custom: string }>;
        createFailedToSendTransactionsError(result);
    }
}

// [DESCRIBE] createFailedToExecuteTransactionPlanError
{
    // It accepts a result tree carrying an entirely custom context.
    {
        const result = null as unknown as TransactionPlanResult<{ custom: string }>;
        createFailedToExecuteTransactionPlanError(result);
    }
}
