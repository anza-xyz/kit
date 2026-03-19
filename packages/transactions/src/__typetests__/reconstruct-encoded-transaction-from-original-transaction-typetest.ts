import { TransactionWithLifetime } from '../lifetime';
import { reconstructEncodedTransactionFromOriginalTransaction } from '../reconstruct-encoded-transaction-from-original-transaction';
import { Transaction } from '../transaction';
import { TransactionWithinSizeLimit } from '../transaction-size';

// [DESCRIBE] reconstructEncodedTransactionFromOriginalTransaction.
{
    // It accepts a Transaction as the original transaction.
    {
        type Input = Parameters<typeof reconstructEncodedTransactionFromOriginalTransaction>[0];
        type _acceptsTransaction = Transaction extends Exclude<Input, undefined> ? true : false;
        const _assertAcceptsTransaction: _acceptsTransaction = true;
        _assertAcceptsTransaction satisfies true;
    }

    // It accepts a Transaction with lifetime.
    {
        type Input = Parameters<typeof reconstructEncodedTransactionFromOriginalTransaction>[0];
        type _acceptsTransactionWithLifetime =
            Transaction & TransactionWithLifetime extends Exclude<Input, undefined> ? true : false;

        const _assertAcceptsTransactionWithLifetime: _acceptsTransactionWithLifetime = true;
        _assertAcceptsTransactionWithLifetime satisfies true;
    }

    // It accepts undefined as original transaction.
    {
        type Input = Parameters<typeof reconstructEncodedTransactionFromOriginalTransaction>[0];
        type _acceptsUndefinedOriginal = undefined extends Input ? true : false;

        const _assertAcceptsUndefinedOriginal: _acceptsUndefinedOriginal = true;
        _assertAcceptsUndefinedOriginal satisfies true;
    }

    // The encoded transaction must be a Uint8Array.
    {
        type Params = Parameters<typeof reconstructEncodedTransactionFromOriginalTransaction>;
        type EncodedTransaction = Params[1];

        type _encodedMustBeUint8Array = EncodedTransaction extends Uint8Array ? true : false;

        const _assertEncodedMustBeUint8Array: _encodedMustBeUint8Array = true;
        _assertEncodedMustBeUint8Array satisfies true;
    }

    // It returns a Promise of Transaction that is within size limit and has a lifetime.
    {
        type Result = ReturnType<typeof reconstructEncodedTransactionFromOriginalTransaction>;
        type _returnsExpectedPromise =
            Result extends Promise<Transaction & TransactionWithinSizeLimit & TransactionWithLifetime> ? true : false;

        const _assertReturnsExpectedPromise: _returnsExpectedPromise = true;
        _assertReturnsExpectedPromise satisfies true;
    }

    // Ensure input union is correct.
    {
        type Input = Parameters<typeof reconstructEncodedTransactionFromOriginalTransaction>[0];

        type _inputUnionCorrect = Input extends Transaction | (Transaction & TransactionWithLifetime) | undefined
            ? true
            : false;

        const _assertInputUnionCorrect: _inputUnionCorrect = true;
        _assertInputUnionCorrect satisfies true;
    }
}
