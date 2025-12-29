import { address } from '@solana/addresses';
import { SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, SolanaError } from '@solana/errors';
import type { BaseTransactionMessage } from '@solana/transaction-messages';
import { TRANSACTION_MESSAGE_INSTRUCTION_LIMIT } from '@solana/transaction-messages';

import {
    assertIsTransactionMessageWithinInstructionLimit,
    getTransactionMessageInstructionCount,
    isTransactionMessageWithinInstructionLimit,
} from '../transaction-message-instruction-limit';

const BASE_TRANSACTION_MESSAGE: BaseTransactionMessage = {
    instructions: [
        {
            programAddress: address('11111111111111111111111111111111'),
        },
    ],
    version: 0,
};

const OVERSIZED_TRANSACTION_MESSAGE: BaseTransactionMessage = {
    instructions: new Array(TRANSACTION_MESSAGE_INSTRUCTION_LIMIT + 1).fill({
        programAddress: address('22222222222222222222222222222222222222222222'),
    }),
    version: 0,
};

describe('getTransactionMessageInstructionCount', () => {
    it('gets the number of instructions in a transaction message', () => {
        expect(getTransactionMessageInstructionCount(BASE_TRANSACTION_MESSAGE)).toBe(1);
    });
});

describe('isTransactionMessageWithinInstructionLimit', () => {
    it('returns true when the instruction count is within the limit', () => {
        expect(isTransactionMessageWithinInstructionLimit(BASE_TRANSACTION_MESSAGE)).toBe(true);
    });

    it('returns false when the instruction count exceeds the limit', () => {
        expect(isTransactionMessageWithinInstructionLimit(OVERSIZED_TRANSACTION_MESSAGE)).toBe(false);
    });
});

describe('assertIsTransactionMessageWithinInstructionLimit', () => {
    it('does not throw when the instruction count is within the limit', () => {
        expect(() => assertIsTransactionMessageWithinInstructionLimit(BASE_TRANSACTION_MESSAGE)).not.toThrow();
    });

    it('throws when the instruction count exceeds the limit', () => {
        expect(() => assertIsTransactionMessageWithinInstructionLimit(OVERSIZED_TRANSACTION_MESSAGE)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, {
                instructionCount: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT + 1,
                instructionLimit: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT,
            }),
        );
    });
});
