import { address } from '@solana/addresses';
import { pipe } from '@solana/functional';
import {
    appendTransactionMessageInstruction,
    createTransactionMessage,
    setTransactionMessageFeePayer,
} from '@solana/transaction-messages';

import { compileTransaction } from '../compile-transaction';
import {
    assertIsTransactionWithinInstructionLimit,
    getTransactionInstructionCount,
    isTransactionWithinInstructionLimit,
} from '../transaction-instruction-limit';

const TRANSACTION = compileTransaction(
    pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayer(address('11111111111111111111111111111111'), m),
        m =>
            appendTransactionMessageInstruction(
                {
                    programAddress: address('22222222222222222222222222222222222222222222'),
                },
                m,
            ),
    ),
);

describe('getTransactionInstructionCount', () => {
    it('gets the number of instructions in a transaction', () => {
        expect(getTransactionInstructionCount(TRANSACTION)).toBe(1);
    });
});

describe('isTransactionWithinInstructionLimit', () => {
    it('returns true when the instruction count is within the limit', () => {
        expect(isTransactionWithinInstructionLimit(TRANSACTION)).toBe(true);
    });
});

describe('assertIsTransactionWithinInstructionLimit', () => {
    it('does not throw when the instruction count is within the limit', () => {
        expect(() => assertIsTransactionWithinInstructionLimit(TRANSACTION)).not.toThrow();
    });
});
