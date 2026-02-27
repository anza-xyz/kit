import { Address } from '@solana/addresses';
import { SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, SolanaError } from '@solana/errors';

import {
    compileTransactionMessage,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithFeePayer,
    TransactionMessageWithLifetime,
} from '../..';
import { compileTransactionMessage as compileLegacyTransactionMessage } from '../legacy/message';
import { compileTransactionMessage as compileV0TransactionMessage } from '../v0/message';
import { compileTransactionMessage as compileV1TransactionMessage } from '../v1/message';

jest.mock('../legacy/message');
jest.mock('../v0/message');
jest.mock('../v1/message');

const MOCK_LIFETIME_CONSTRAINT =
    'SOME_CONSTRAINT' as unknown as TransactionMessageWithBlockhashLifetime['lifetimeConstraint'];

describe('compileTransactionMessage', () => {
    it('uses the legacy compiler for legacy messages', () => {
        const mockCompiledMessage = { version: 'legacy' } as unknown as ReturnType<
            typeof compileLegacyTransactionMessage
        >;
        jest.mocked(compileLegacyTransactionMessage).mockReturnValue(mockCompiledMessage);

        const tx: TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime = {
            feePayer: { address: 'abc' as Address },
            instructions: [],
            lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
            version: 'legacy',
        };

        expect(compileTransactionMessage(tx)).toBe(mockCompiledMessage);
        expect(compileLegacyTransactionMessage).toHaveBeenCalledTimes(1);
        expect(compileLegacyTransactionMessage).toHaveBeenCalledWith(tx);
    });

    it('uses the v0 compiler for v0 messages', () => {
        const mockCompiledMessage = { version: 0 } as unknown as ReturnType<typeof compileV0TransactionMessage>;
        jest.mocked(compileV0TransactionMessage).mockReturnValue(mockCompiledMessage);

        const tx: TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime = {
            feePayer: { address: 'abc' as Address },
            instructions: [],
            lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
            version: 0,
        };

        expect(compileTransactionMessage(tx)).toBe(mockCompiledMessage);
        expect(compileV0TransactionMessage).toHaveBeenCalledTimes(1);
        expect(compileV0TransactionMessage).toHaveBeenCalledWith(tx);
    });

    it('uses the v1 compiler for v1 messages', () => {
        const mockCompiledMessage = { version: 1 } as unknown as ReturnType<typeof compileV1TransactionMessage>;
        jest.mocked(compileV1TransactionMessage).mockReturnValue(mockCompiledMessage);

        const tx: TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime = {
            feePayer: { address: 'abc' as Address },
            instructions: [],
            lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
            version: 1,
        };

        expect(compileTransactionMessage(tx)).toBe(mockCompiledMessage);
        expect(compileV1TransactionMessage).toHaveBeenCalledTimes(1);
        expect(compileV1TransactionMessage).toHaveBeenCalledWith(tx);
    });

    it('throws for unsupported v2 transaction', () => {
        const tx = {
            feePayer: { address: 'abc' as Address },
            instructions: [],
            lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
            version: 2,
        } as unknown as TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime;

        expect(() => compileTransactionMessage(tx)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
                version: 2,
            }),
        );
    });
});
