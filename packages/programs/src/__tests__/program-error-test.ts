import { Address } from '@solana/addresses';
import { SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM, SolanaError } from '@solana/errors';
import { pipe } from '@solana/functional';
import {
    appendTransactionMessageInstruction,
    createTransactionMessage,
    TransactionMessage,
} from '@solana/transaction-messages';

import { isProgramError } from '../program-error';

describe('isProgramError', () => {
    const programAddress = '1111' as Address;
    describe('when the error carries a responsible program address', () => {
        let error: SolanaError;
        beforeEach(() => {
            error = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM, {
                code: 42,
                index: 0,
                responsibleProgramAddress: programAddress,
            });
        });
        it('identifies the error as a custom program error', () => {
            expect(isProgramError(error, programAddress)).toBe(true);
        });
        it('matches the provided custom program error code', () => {
            expect(isProgramError(error, programAddress, 42)).toBe(true);
        });
        it('returns false if the program address does not match', () => {
            expect(isProgramError(error, '2222' as Address)).toBe(false);
        });
        it('returns false if the custom program error code does not match', () => {
            expect(isProgramError(error, programAddress, 43)).toBe(false);
        });
    });
    describe('when the error does not carry a responsible program address but the user supplied a transaction message', () => {
        let error: SolanaError;
        let transactionMessage: TransactionMessage;
        beforeEach(() => {
            error = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM, {
                code: 42,
                index: 0,
            });
            transactionMessage = pipe(createTransactionMessage({ version: 0 }), m =>
                appendTransactionMessageInstruction({ programAddress }, m),
            );
        });
        it('uses the transaction message to identify the error as a custom program error', () => {
            expect(isProgramError(error, transactionMessage, programAddress)).toBe(true);
        });
        it('uses the transaction message to match the provided custom program error code', () => {
            expect(isProgramError(error, transactionMessage, programAddress, 42)).toBe(true);
        });
        it('returns false if the program address does not match', () => {
            expect(isProgramError(error, transactionMessage, '2222' as Address)).toBe(false);
        });
        it('returns false if the custom program error code does not match', () => {
            expect(isProgramError(error, transactionMessage, programAddress, 43)).toBe(false);
        });
    });
    describe('when the error carries a responsible program address and the user supplied a transaction message', () => {
        let error: SolanaError;
        let transactionMessage: TransactionMessage;
        beforeEach(() => {
            error = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM, {
                code: 42,
                index: 0,
                responsibleProgramAddress: programAddress,
            });
            transactionMessage = pipe(createTransactionMessage({ version: 0 }), m =>
                appendTransactionMessageInstruction({ programAddress: '2222' as Address }, m),
            );
        });
        it('uses the responsible program address in the error context to identify the error as a custom program error', () => {
            expect(isProgramError(error, transactionMessage, programAddress)).toBe(true);
        });
        it('uses the responsible program address in the error context to match the provided custom program error code', () => {
            expect(isProgramError(error, transactionMessage, programAddress, 42)).toBe(true);
        });
        it('returns false if the program address does not match, ignoring the contents of the transaction message', () => {
            expect(isProgramError(error, transactionMessage, '2222' as Address)).toBe(false);
        });
        it('returns false if the custom program error code does not match', () => {
            expect(isProgramError(error, transactionMessage, programAddress, 43)).toBe(false);
        });
    });
    describe('when the error does not carry a responsible program address and the user supplied a transaction message in which the referenced top-level instruction can not be found', () => {
        let error: SolanaError;
        let transactionMessage: TransactionMessage;
        beforeEach(() => {
            error = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM, {
                code: 42,
                index: 999,
            });
            transactionMessage = pipe(createTransactionMessage({ version: 0 }), m =>
                appendTransactionMessageInstruction({ programAddress }, m),
            );
        });
        it('returns false', () => {
            expect(isProgramError(error, transactionMessage, programAddress)).toBe(false);
        });
    });
});
