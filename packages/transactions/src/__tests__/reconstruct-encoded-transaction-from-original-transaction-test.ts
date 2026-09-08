import '@solana/test-matchers/toBeFrozenObject';

import { address } from '@solana/addresses';
import { bytesEqual } from '@solana/codecs-core';
import { Blockhash } from '@solana/rpc-types';
import { getCompiledTransactionMessageDecoder, Nonce } from '@solana/transaction-messages';

import { getTransactionCodec } from '../codecs';
import {
    getTransactionLifetimeConstraintFromCompiledTransactionMessage,
    TransactionBlockhashLifetime,
    TransactionDurableNonceLifetime,
} from '../lifetime';
import { reconstructEncodedTransactionFromOriginalTransaction } from '../reconstruct-encoded-transaction-from-original-transaction';
import type { Transaction, TransactionMessageBytes } from '../transaction';
import { assertIsTransactionWithinSizeLimit } from '../transaction-size';

jest.mock('@solana/codecs-core', () => ({
    ...jest.requireActual('@solana/codecs-core'),
    bytesEqual: jest.fn(),
}));
jest.mock('@solana/transaction-messages', () => ({
    ...jest.requireActual('@solana/transaction-messages'),
    getCompiledTransactionMessageDecoder: jest.fn(),
}));
jest.mock('../codecs', () => ({
    getTransactionCodec: jest.fn(),
}));
jest.mock('../lifetime', () => ({
    ...jest.requireActual('../lifetime'),
    getTransactionLifetimeConstraintFromCompiledTransactionMessage: jest.fn(),
}));
jest.mock('../transaction-size', () => ({
    ...jest.requireActual('../transaction-size'),
    assertIsTransactionWithinSizeLimit: jest.fn(),
}));

describe('reconstructEncodedTransactionFromOriginalTransaction', () => {
    const encodedTransaction = new Uint8Array([9, 8, 7]);
    const originalMessageBytes = new Uint8Array([1, 2, 3]) as unknown as TransactionMessageBytes;
    const signedMessageBytes = new Uint8Array([4, 5, 6]) as unknown as TransactionMessageBytes;
    const decodedSignedTransaction = {
        messageBytes: signedMessageBytes,
        signatures: {},
    } as Transaction;
    const existingLifetime: TransactionBlockhashLifetime = {
        blockhash: 'abc' as Blockhash,
        lastValidBlockHeight: 123n,
    };
    const newLifetime: TransactionBlockhashLifetime = {
        blockhash: 'def' as Blockhash,
        lastValidBlockHeight: 456n,
    };

    beforeEach(() => {
        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: jest.fn().mockReturnValue(decodedSignedTransaction),
        } as unknown as ReturnType<typeof getTransactionCodec>);
        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue({ lifetimeToken: 'def' }),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);
        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockResolvedValue(newLifetime);
        jest.mocked(bytesEqual).mockReturnValue(false);
    });

    it('reuses the original lifetime when message bytes are unchanged', async () => {
        expect.assertions(2);
        jest.mocked(bytesEqual).mockReturnValue(true);
        const originalTransaction = {
            lifetimeConstraint: existingLifetime,
            messageBytes: originalMessageBytes,
            signatures: {},
        } as Transaction & { lifetimeConstraint: typeof existingLifetime };

        const result = await reconstructEncodedTransactionFromOriginalTransaction(
            originalTransaction,
            encodedTransaction,
        );

        expect(result).toEqual({
            ...decodedSignedTransaction,
            lifetimeConstraint: existingLifetime,
        });
        expect(getTransactionLifetimeConstraintFromCompiledTransactionMessage).not.toHaveBeenCalled();
    });

    it('reuses the original lifetime when the compiled lifetime token is unchanged', async () => {
        expect.assertions(2);
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue({ lifetimeToken: 'abc' }),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);
        const originalTransaction = {
            lifetimeConstraint: existingLifetime,
            messageBytes: originalMessageBytes,
            signatures: {},
        } as Transaction & { lifetimeConstraint: typeof existingLifetime };

        const result = await reconstructEncodedTransactionFromOriginalTransaction(
            originalTransaction,
            encodedTransaction,
        );

        expect(result).toEqual({
            ...decodedSignedTransaction,
            lifetimeConstraint: existingLifetime,
        });
        expect(getTransactionLifetimeConstraintFromCompiledTransactionMessage).not.toHaveBeenCalled();
    });

    it('reuses a durable nonce lifetime when the compiled lifetime token matches the nonce', async () => {
        expect.assertions(1);
        const nonceLifetime: TransactionDurableNonceLifetime = {
            nonce: 'nonce-token' as Nonce,
            nonceAccountAddress: address('11111111111111111111111111111111'),
        };
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue({ lifetimeToken: 'nonce-token' }),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);
        const originalTransaction = {
            lifetimeConstraint: nonceLifetime,
            messageBytes: originalMessageBytes,
            signatures: {},
        } as Transaction & { lifetimeConstraint: typeof nonceLifetime };

        const result = await reconstructEncodedTransactionFromOriginalTransaction(
            originalTransaction,
            encodedTransaction,
        );

        expect(result.lifetimeConstraint).toBe(nonceLifetime);
    });

    it('derives a new lifetime when the original transaction has none', async () => {
        expect.assertions(1);
        const originalTransaction = {
            messageBytes: originalMessageBytes,
            signatures: {},
        } as Transaction;

        const result = await reconstructEncodedTransactionFromOriginalTransaction(
            originalTransaction,
            encodedTransaction,
        );

        expect(result).toEqual({
            ...decodedSignedTransaction,
            lifetimeConstraint: newLifetime,
        });
    });

    it('derives a new lifetime when the compiled lifetime token changed', async () => {
        expect.assertions(1);
        const originalTransaction = {
            lifetimeConstraint: existingLifetime,
            messageBytes: originalMessageBytes,
            signatures: {},
        } as Transaction & { lifetimeConstraint: typeof existingLifetime };

        const result = await reconstructEncodedTransactionFromOriginalTransaction(
            originalTransaction,
            encodedTransaction,
        );

        expect(result).toEqual({
            ...decodedSignedTransaction,
            lifetimeConstraint: newLifetime,
        });
    });

    it('asserts that the decoded transaction is within the size limit', async () => {
        expect.assertions(1);
        const originalTransaction = {
            messageBytes: originalMessageBytes,
            signatures: {},
        } as Transaction;

        await reconstructEncodedTransactionFromOriginalTransaction(originalTransaction, encodedTransaction);

        expect(assertIsTransactionWithinSizeLimit).toHaveBeenCalledWith(decodedSignedTransaction);
    });

    it('freezes the returned transaction', async () => {
        expect.assertions(1);
        const originalTransaction = {
            messageBytes: originalMessageBytes,
            signatures: {},
        } as Transaction;

        const result = await reconstructEncodedTransactionFromOriginalTransaction(
            originalTransaction,
            encodedTransaction,
        );

        expect(result).toBeFrozenObject();
    });
});
