import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';

import { getTransactionCodec } from '../codecs';
import { getTransactionLifetimeConstraintFromCompiledTransactionMessage, TransactionWithLifetime } from '../lifetime';
import { reconstructEncodedTransactionFromOriginalTransaction } from '../reconstruct-encoded-transaction-from-original-transaction';
import { Transaction } from '../transaction';

jest.mock('@solana/transaction-messages');
jest.mock('../codecs');
jest.mock('../lifetime');
jest.mock('../transaction-size');

describe('reconstructEncodedTransactionFromOriginalTransaction', () => {
    const encodedTransaction = new Uint8Array([9, 8, 7]);
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('preserves the existing lifetime when message bytes are unchanged', async () => {
        expect.assertions(2);
        const originalLifetime = { blockhash: 'abc', lastValidBlockHeight: 123n };
        const originalTransaction = {
            lifetimeConstraint: originalLifetime,
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Transaction & TransactionWithLifetime;
        const decodedSignedTransaction = {
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Transaction;
        const decode = jest.fn().mockReturnValue(decodedSignedTransaction);
        jest.mocked(getTransactionCodec).mockReturnValue({ decode } as unknown as ReturnType<
            typeof getTransactionCodec
        >);
        const result = await reconstructEncodedTransactionFromOriginalTransaction(
            originalTransaction,
            encodedTransaction,
        );
        expect(getTransactionLifetimeConstraintFromCompiledTransactionMessage).not.toHaveBeenCalled();
        expect(result).toEqual(Object.freeze({ ...decodedSignedTransaction, lifetimeConstraint: originalLifetime }));
    });

    it('preserves the existing lifetime when lifetime token is unchanged', async () => {
        expect.assertions(2);
        const originalLifetime = { blockhash: 'abc', lastValidBlockHeight: 123n };
        const originalTransaction = {
            lifetimeConstraint: originalLifetime,
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Transaction & TransactionWithLifetime;
        const decodedSignedTransaction = {
            messageBytes: new Uint8Array([3, 2, 1]),
            signatures: {},
        } as unknown as Transaction;
        const decode = jest.fn().mockReturnValue(decodedSignedTransaction);
        const decodeCompiledMessage = jest.fn().mockReturnValue({ lifetimeToken: 'abc' });
        jest.mocked(getTransactionCodec).mockReturnValue({ decode } as unknown as ReturnType<
            typeof getTransactionCodec
        >);
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: decodeCompiledMessage,
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);
        const result = await reconstructEncodedTransactionFromOriginalTransaction(
            originalTransaction,
            encodedTransaction,
        );
        expect(getTransactionLifetimeConstraintFromCompiledTransactionMessage).not.toHaveBeenCalled();
        expect(result).toEqual(Object.freeze({ ...decodedSignedTransaction, lifetimeConstraint: originalLifetime }));
    });

    it('recomputes lifetime when the transaction has no original lifetime', async () => {
        expect.assertions(2);
        const originalTransaction = {
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Transaction;
        const decodedSignedTransaction = {
            messageBytes: new Uint8Array([3, 2, 1]),
            signatures: {},
        } as unknown as Transaction;
        const decode = jest.fn().mockReturnValue(decodedSignedTransaction);
        const compiledTransactionMessage = { lifetimeToken: 'def' };
        const decodeCompiledMessage = jest.fn().mockReturnValue(compiledTransactionMessage);
        const newLifetime = { blockhash: 'def', lastValidBlockHeight: 456n };
        jest.mocked(getTransactionCodec).mockReturnValue({ decode } as unknown as ReturnType<
            typeof getTransactionCodec
        >);
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: decodeCompiledMessage,
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);
        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockResolvedValue(
            newLifetime as Awaited<ReturnType<typeof getTransactionLifetimeConstraintFromCompiledTransactionMessage>>,
        );
        const result = await reconstructEncodedTransactionFromOriginalTransaction(
            originalTransaction,
            encodedTransaction,
        );
        expect(getTransactionLifetimeConstraintFromCompiledTransactionMessage).toHaveBeenCalledWith(
            compiledTransactionMessage,
        );
        expect(result).toEqual(Object.freeze({ ...decodedSignedTransaction, lifetimeConstraint: newLifetime }));
    });

    it('recomputes lifetime when the existing lifetime token changed', async () => {
        expect.assertions(2);
        const originalTransaction = {
            lifetimeConstraint: { blockhash: 'abc', lastValidBlockHeight: 123n },
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Transaction & TransactionWithLifetime;
        const decodedSignedTransaction = {
            messageBytes: new Uint8Array([3, 2, 1]),
            signatures: {},
        } as unknown as Transaction;
        const decode = jest.fn().mockReturnValue(decodedSignedTransaction);
        const compiledTransactionMessage = { lifetimeToken: 'def' };
        const decodeCompiledMessage = jest.fn().mockReturnValue(compiledTransactionMessage);
        const newLifetime = { blockhash: 'def', lastValidBlockHeight: 456n };
        jest.mocked(getTransactionCodec).mockReturnValue({ decode } as unknown as ReturnType<
            typeof getTransactionCodec
        >);
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: decodeCompiledMessage,
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);
        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockResolvedValue(
            newLifetime as Awaited<ReturnType<typeof getTransactionLifetimeConstraintFromCompiledTransactionMessage>>,
        );
        const result = await reconstructEncodedTransactionFromOriginalTransaction(
            originalTransaction,
            encodedTransaction,
        );
        expect(getTransactionLifetimeConstraintFromCompiledTransactionMessage).toHaveBeenCalledWith(
            compiledTransactionMessage,
        );
        expect(result).toEqual(Object.freeze({ ...decodedSignedTransaction, lifetimeConstraint: newLifetime }));
    });

    it('propagates errors from lifetime constraint extraction', async () => {
        expect.assertions(1);
        const originalTransaction = {
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Transaction;
        const decodedSignedTransaction = {
            messageBytes: new Uint8Array([4, 5, 6]),
            signatures: {},
        } as unknown as Transaction;
        const decode = jest.fn().mockReturnValue(decodedSignedTransaction);
        const compiledMessage = { lifetimeToken: 'abc' };
        jest.mocked(getTransactionCodec).mockReturnValue({ decode } as unknown as ReturnType<
            typeof getTransactionCodec
        >);
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue(compiledMessage),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);
        const error = new Error('lifetime extraction failed');
        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockRejectedValue(error);
        await expect(
            reconstructEncodedTransactionFromOriginalTransaction(originalTransaction, new Uint8Array([9, 8, 7])),
        ).rejects.toThrow(error);
    });

    it('propagates errors from compiled transaction message decoding', async () => {
        expect.assertions(1);
        const originalTransaction = {
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Transaction;
        const decodedSignedTransaction = {
            messageBytes: new Uint8Array([4, 5, 6]),
            signatures: {},
        } as unknown as Transaction;
        const decode = jest.fn().mockReturnValue(decodedSignedTransaction);
        const decodeCompiledMessageError = new Error('compiled message decode failed');
        jest.mocked(getTransactionCodec).mockReturnValue({ decode } as unknown as ReturnType<
            typeof getTransactionCodec
        >);
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockImplementation(() => {
                throw decodeCompiledMessageError;
            }),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);
        await expect(
            reconstructEncodedTransactionFromOriginalTransaction(originalTransaction, encodedTransaction),
        ).rejects.toThrow(decodeCompiledMessageError);
    });
});
