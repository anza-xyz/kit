import {
    SOLANA_ERROR__INSTRUCTION_PLANS__EMPTY_INSTRUCTION_PLAN,
    SOLANA_ERROR__INSTRUCTION_PLANS__INVALID_MAX_INSTRUCTIONS_PER_TRANSACTION,
    SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED,
    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN,
    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE,
    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_REJECTED_BY_PACKER,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES,
    SolanaError,
} from '@solana/errors';

import {
    assertMaxInstructionsPerTransaction,
    assertMessageCanAccommodateSize,
    isMessagePackerErrorThatRequiresNewCandidate,
    resolveMaxInstructionsPerTransaction,
} from '../message-packer-errors';

describe('resolveMaxInstructionsPerTransaction', () => {
    it('defaults to 16 when no value is provided', () => {
        expect(resolveMaxInstructionsPerTransaction()).toBe(16);
        expect(resolveMaxInstructionsPerTransaction(undefined)).toBe(16);
    });
    it('returns a valid provided value as-is', () => {
        expect(resolveMaxInstructionsPerTransaction(1)).toBe(1);
        expect(resolveMaxInstructionsPerTransaction(42)).toBe(42);
        expect(resolveMaxInstructionsPerTransaction(64)).toBe(64);
    });
    it.each([0, -1, 1.5, 65, Number.NaN])('throws when the provided value is %p', maxInstructions => {
        expect(() => resolveMaxInstructionsPerTransaction(maxInstructions)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__INVALID_MAX_INSTRUCTIONS_PER_TRANSACTION, {
                maxInstructions,
                transactionInstructionLimit: 64,
            }),
        );
    });
});

describe('assertMaxInstructionsPerTransaction', () => {
    it('passes when the number of instructions is within the maximum', () => {
        expect(() => assertMaxInstructionsPerTransaction(16, 16)).not.toThrow();
        expect(() => assertMaxInstructionsPerTransaction(0, 1)).not.toThrow();
    });
    it('throws when the number of instructions exceeds the maximum', () => {
        expect(() => assertMaxInstructionsPerTransaction(17, 16)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED, {
                maxInstructions: 16,
                numInstructions: 17,
            }),
        );
    });
});

describe('assertMessageCanAccommodateSize', () => {
    it('passes when the next size is within the limit', () => {
        expect(() =>
            assertMessageCanAccommodateSize({ currentSize: 100, nextSize: 1232, sizeLimit: 1232 }),
        ).not.toThrow();
    });
    it('throws with the required and free bytes when the next size exceeds the limit', () => {
        expect(() => assertMessageCanAccommodateSize({ currentSize: 1132, nextSize: 1282, sizeLimit: 1232 })).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
                numBytesRequired: 150,
                numFreeBytes: 100,
            }),
        );
    });
});

describe('isMessagePackerErrorThatRequiresNewCandidate', () => {
    it.each([
        new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MAX_INSTRUCTIONS_PER_TRANSACTION_EXCEEDED, {
            maxInstructions: 16,
            numInstructions: 17,
        }),
        new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
            numBytesRequired: 150,
            numFreeBytes: 100,
        }),
        new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_REJECTED_BY_PACKER, { reason: 'test' }),
        new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES, { actualCount: 65, maxAllowed: 64 }),
        new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION, {
            actualCount: 256,
            instructionIndex: 0,
            maxAllowed: 255,
        }),
        new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS, { actualCount: 65, maxAllowed: 64 }),
        new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES, { actualCount: 65, maxAllowed: 64 }),
    ])('returns true for %s', error => {
        expect(isMessagePackerErrorThatRequiresNewCandidate(error)).toBe(true);
    });
    it.each([
        new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE),
        new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__EMPTY_INSTRUCTION_PLAN),
        new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__INVALID_MAX_INSTRUCTIONS_PER_TRANSACTION, {
            maxInstructions: 65,
            transactionInstructionLimit: 64,
        }),
        new Error('not a Solana error'),
        null,
        undefined,
        'a string',
    ])('returns false for %s', error => {
        expect(isMessagePackerErrorThatRequiresNewCandidate(error)).toBe(false);
    });
});
