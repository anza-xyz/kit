import { TransactionMessageWithBlockhashLifetime } from '../blockhash';
import { CompilableTransactionMessage } from '../compilable-transaction-message';
import { TransactionMessageWithDurableNonceLifetime } from '../durable-nonce';
import { TransactionMessageWithFeePayer } from '../fee-payer';
import { BaseTransactionMessage } from '../transaction-message';

// BaseTransactionMessage is not compilable.
{
    const message = null as unknown as BaseTransactionMessage;
    // @ts-expect-error missing fee payer + lifetime token
    message satisfies CompilableTransactionMessage;
}

// BaseTransactionMessage with fee payer is not compilable.
{
    const message = null as unknown as BaseTransactionMessage & TransactionMessageWithFeePayer;
    // @ts-expect-error missing lifetime token
    message satisfies CompilableTransactionMessage;
}

// BaseTransactionMessage with blockhash lifetime is not compilable.
{
    const message = null as unknown as BaseTransactionMessage & TransactionMessageWithBlockhashLifetime;
    // @ts-expect-error missing fee payer
    message satisfies CompilableTransactionMessage;
}

// BaseTransactionMessage with durable nonce lifetime is not compilable.
{
    const message = null as unknown as BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime;
    // @ts-expect-error missing fee payer
    message satisfies CompilableTransactionMessage;
}

// BaseTransactionMessage with fee payer and blockhash lifetime is compilable.
{
    const message = null as unknown as BaseTransactionMessage &
        TransactionMessageWithBlockhashLifetime &
        TransactionMessageWithFeePayer;
    message satisfies CompilableTransactionMessage;
}

// BaseTransactionMessage with fee payer and durable nonce lifetime is compilable.
{
    const message = null as unknown as BaseTransactionMessage &
        TransactionMessageWithDurableNonceLifetime &
        TransactionMessageWithFeePayer;
    message satisfies CompilableTransactionMessage;
}
