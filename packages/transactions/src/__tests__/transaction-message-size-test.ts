import { address } from '@solana/addresses';
import { SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, SolanaError } from '@solana/errors';
import { pipe } from '@solana/functional';
import type { Blockhash } from '@solana/rpc-types';
import {
    appendTransactionMessageInstruction,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/transaction-messages';

import {
    assertIsTransactionMessageWithinSizeLimit,
    getTransactionMessageSize,
    isTransactionMessageWithinSizeLimit,
} from '../transaction-message-size';
import { TRANSACTION_SIZE_LIMIT } from '../transaction-size';

const MOCK_BLOCKHASH = {
    blockhash: '11111111111111111111111111111111' as Blockhash,
    lastValidBlockHeight: 0n,
};

const SMALL_TRANSACTION_MESSAGE = pipe(
    createTransactionMessage({ version: 0 }),
    m => setTransactionMessageLifetimeUsingBlockhash(MOCK_BLOCKHASH, m),
    m => setTransactionMessageFeePayer(address('22222222222222222222222222222222222222222222'), m),
);

const OVERSIZED_TRANSACTION_MESSAGE = pipe(SMALL_TRANSACTION_MESSAGE, m =>
    appendTransactionMessageInstruction(
        {
            data: new Uint8Array(TRANSACTION_SIZE_LIMIT + 1),
            programAddress: address('33333333333333333333333333333333333333333333'),
        },
        m,
    ),
);

describe('getTransactionMessageSize', () => {
    it('gets the size of a compilable transaction message', () => {
        expect(getTransactionMessageSize(SMALL_TRANSACTION_MESSAGE)).toBe(136);
    });

    it('gets the size of an oversized compilable transaction message', () => {
        expect(getTransactionMessageSize(OVERSIZED_TRANSACTION_MESSAGE)).toBe(1405);
    });
});

describe('isTransactionMessageWithinSizeLimit', () => {
    it('returns true when the compiled size is under the transaction size limit', () => {
        expect(isTransactionMessageWithinSizeLimit(SMALL_TRANSACTION_MESSAGE)).toBe(true);
    });

    it('returns false when the compiled size is above the transaction size limit', () => {
        expect(isTransactionMessageWithinSizeLimit(OVERSIZED_TRANSACTION_MESSAGE)).toBe(false);
    });
});

describe('assertIsTransactionMessageWithinSizeLimit', () => {
    it('does not throw when the compiled size is under the transaction size limit', () => {
        expect(() => assertIsTransactionMessageWithinSizeLimit(SMALL_TRANSACTION_MESSAGE)).not.toThrow();
    });

    it('throws when the compiled size is above the transaction size limit', () => {
        expect(() => assertIsTransactionMessageWithinSizeLimit(OVERSIZED_TRANSACTION_MESSAGE)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, {
                transactionSize: 1405,
                transactionSizeLimit: TRANSACTION_SIZE_LIMIT,
            }),
        );
    });
});
