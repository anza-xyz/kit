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
    getTransactionMessageSizeLimit,
    isTransactionMessageWithinSizeLimit,
} from '../transaction-message-size';
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

const OVERSIZED_TRANSACTION_MESSAGE = pipe(SMALL_TRANSACTION_MESSAGE, m =>
    appendTransactionMessageInstruction(
        {
            data: new Uint8Array(LEGACY_TRANSACTION_SIZE_LIMIT + 1),
            programAddress: address('33333333333333333333333333333333333333333333'),
        },
        m,
    ),
);

const SMALL_V1_TRANSACTION_MESSAGE = pipe(
    // @ts-expect-error v1 not yet included in type for `createTransactionMessage`
    createTransactionMessage({ version: 1 }),
    m => setTransactionMessageLifetimeUsingBlockhash(MOCK_BLOCKHASH, m),
    m => setTransactionMessageFeePayer(address('22222222222222222222222222222222222222222222'), m),
);

describe('getTransactionMessageSizeLimit', () => {
    it('returns LEGACY_TRANSACTION_SIZE_LIMIT for a legacy transaction message', () => {
        const legacyMessage = pipe(createTransactionMessage({ version: 'legacy' }), m =>
            setTransactionMessageFeePayer(address('22222222222222222222222222222222222222222222'), m),
        );
        expect(getTransactionMessageSizeLimit(legacyMessage)).toBe(LEGACY_TRANSACTION_SIZE_LIMIT);
    });

    it('returns LEGACY_TRANSACTION_SIZE_LIMIT for a v0 transaction message', () => {
        expect(getTransactionMessageSizeLimit(SMALL_TRANSACTION_MESSAGE)).toBe(LEGACY_TRANSACTION_SIZE_LIMIT);
    });

    it('returns V1_TRANSACTION_SIZE_LIMIT for a v1 transaction message', () => {
        expect(getTransactionMessageSizeLimit(SMALL_V1_TRANSACTION_MESSAGE)).toBe(V1_TRANSACTION_SIZE_LIMIT);
    });
});

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

    it('returns true for a v1 message whose size exceeds the legacy limit but is within the v1 limit', () => {
        const v1MessageOverLegacyLimit = pipe(SMALL_V1_TRANSACTION_MESSAGE, m =>
            appendTransactionMessageInstruction(
                {
                    data: new Uint8Array(LEGACY_TRANSACTION_SIZE_LIMIT + 1),
                    programAddress: address('33333333333333333333333333333333333333333333'),
                },
                m,
            ),
        );
        expect(isTransactionMessageWithinSizeLimit(v1MessageOverLegacyLimit)).toBe(true);
    });

    it('returns false for a v1 message whose size exceeds the v1 limit', () => {
        const v1MessageOverV1Limit = pipe(SMALL_V1_TRANSACTION_MESSAGE, m =>
            appendTransactionMessageInstruction(
                {
                    data: new Uint8Array(V1_TRANSACTION_SIZE_LIMIT + 1),
                    programAddress: address('33333333333333333333333333333333333333333333'),
                },
                m,
            ),
        );
        expect(isTransactionMessageWithinSizeLimit(v1MessageOverV1Limit)).toBe(false);
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
                transactionSizeLimit: LEGACY_TRANSACTION_SIZE_LIMIT,
            }),
        );
    });

    it('does not throw for a v1 message whose size exceeds the legacy limit but is within the v1 limit', () => {
        const v1MessageOverLegacyLimit = pipe(SMALL_V1_TRANSACTION_MESSAGE, m =>
            appendTransactionMessageInstruction(
                {
                    data: new Uint8Array(LEGACY_TRANSACTION_SIZE_LIMIT + 1),
                    programAddress: address('33333333333333333333333333333333333333333333'),
                },
                m,
            ),
        );
        expect(() => assertIsTransactionMessageWithinSizeLimit(v1MessageOverLegacyLimit)).not.toThrow();
    });

    it('throws for a v1 message whose size exceeds the v1 limit', () => {
        const v1MessageOverV1Limit = pipe(SMALL_V1_TRANSACTION_MESSAGE, m =>
            appendTransactionMessageInstruction(
                {
                    data: new Uint8Array(V1_TRANSACTION_SIZE_LIMIT + 1),
                    programAddress: address('33333333333333333333333333333333333333333333'),
                },
                m,
            ),
        );
        expect(() => assertIsTransactionMessageWithinSizeLimit(v1MessageOverV1Limit)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, {
                transactionSize: 4271,
                transactionSizeLimit: V1_TRANSACTION_SIZE_LIMIT,
            }),
        );
    });
});
