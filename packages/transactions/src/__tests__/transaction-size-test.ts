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

import { compileTransaction } from '../compile-transaction';
import {
    assertIsTransactionWithinSizeLimit,
    getTransactionSize,
    isTransactionWithinSizeLimit,
} from '../transaction-size';
import { LEGACY_TRANSACTION_SIZE_LIMIT, V1_TRANSACTION_SIZE_LIMIT } from '../transaction-size-limits';

const MOCK_BLOCKHASH = {
    blockhash: '11111111111111111111111111111111' as Blockhash,
    lastValidBlockHeight: 0n,
};

const SMALL_TRANSACTION_MESSAGE = pipe(
    createTransactionMessage({ version: 0 }),
    m => setTransactionMessageLifetimeUsingBlockhash(MOCK_BLOCKHASH, m),
    m => setTransactionMessageFeePayer(address('22222222222222222222222222222222222222222222'), m),
);

const SMALL_TRANSACTION = compileTransaction(SMALL_TRANSACTION_MESSAGE);

const OVERSIZED_TRANSACTION = compileTransaction(
    pipe(SMALL_TRANSACTION_MESSAGE, m =>
        appendTransactionMessageInstruction(
            {
                data: new Uint8Array(LEGACY_TRANSACTION_SIZE_LIMIT + 1),
                programAddress: address('33333333333333333333333333333333333333333333'),
            },
            m,
        ),
    ),
);

const SMALL_V1_TRANSACTION_MESSAGE = pipe(
    // @ts-expect-error v1 not yet included in type for `createTransactionMessage`
    createTransactionMessage({ version: 1 }),
    m => setTransactionMessageLifetimeUsingBlockhash(MOCK_BLOCKHASH, m),
    m => setTransactionMessageFeePayer(address('22222222222222222222222222222222222222222222'), m),
);

// A v1 transaction whose size exceeds the legacy limit but is within the v1 limit.
const V1_TRANSACTION_OVER_LEGACY_LIMIT = compileTransaction(
    pipe(SMALL_V1_TRANSACTION_MESSAGE, m =>
        appendTransactionMessageInstruction(
            {
                data: new Uint8Array(LEGACY_TRANSACTION_SIZE_LIMIT + 1),
                programAddress: address('33333333333333333333333333333333333333333333'),
            },
            m,
        ),
    ),
);

// A v1 transaction whose size exceeds the v1 limit.
const V1_TRANSACTION_OVER_V1_LIMIT = compileTransaction(
    pipe(SMALL_V1_TRANSACTION_MESSAGE, m =>
        appendTransactionMessageInstruction(
            {
                data: new Uint8Array(V1_TRANSACTION_SIZE_LIMIT + 1),
                programAddress: address('33333333333333333333333333333333333333333333'),
            },
            m,
        ),
    ),
);

describe('getTransactionSize', () => {
    it('gets the size of a transaction', () => {
        expect(getTransactionSize(SMALL_TRANSACTION)).toBe(136);
    });

    it('gets the size of an oversized transaction', () => {
        expect(getTransactionSize(OVERSIZED_TRANSACTION)).toBe(1405);
    });
});

describe('isTransactionWithinSizeLimit', () => {
    it('returns true when the transaction size is under the transaction size limit', () => {
        expect(isTransactionWithinSizeLimit(SMALL_TRANSACTION)).toBe(true);
    });

    it('returns false when the transaction size is above the transaction size limit', () => {
        expect(isTransactionWithinSizeLimit(OVERSIZED_TRANSACTION)).toBe(false);
    });

    it('returns true for a v1 transaction whose size exceeds the legacy limit but is within the v1 limit', () => {
        expect(isTransactionWithinSizeLimit(V1_TRANSACTION_OVER_LEGACY_LIMIT)).toBe(true);
    });

    it('returns false for a v1 transaction whose size exceeds the v1 limit', () => {
        expect(isTransactionWithinSizeLimit(V1_TRANSACTION_OVER_V1_LIMIT)).toBe(false);
    });
});

describe('assertIsTransactionWithinSizeLimit', () => {
    it('does not throw when the transaction size is under the transaction size limit', () => {
        expect(() => assertIsTransactionWithinSizeLimit(SMALL_TRANSACTION)).not.toThrow();
    });

    it('throws when the transaction size is above the transaction size limit', () => {
        expect(() => assertIsTransactionWithinSizeLimit(OVERSIZED_TRANSACTION)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, {
                transactionSize: 1405,
                transactionSizeLimit: LEGACY_TRANSACTION_SIZE_LIMIT,
            }),
        );
    });

    it('does not throw for a v1 transaction whose size exceeds the legacy limit but is within the v1 limit', () => {
        expect(() => assertIsTransactionWithinSizeLimit(V1_TRANSACTION_OVER_LEGACY_LIMIT)).not.toThrow();
    });

    it('throws for a v1 transaction whose size exceeds the v1 limit', () => {
        expect(() => assertIsTransactionWithinSizeLimit(V1_TRANSACTION_OVER_V1_LIMIT)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, {
                transactionSize: 4271,
                transactionSizeLimit: V1_TRANSACTION_SIZE_LIMIT,
            }),
        );
    });
});
