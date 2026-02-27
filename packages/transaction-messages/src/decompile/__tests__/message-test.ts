import { SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, SolanaError } from '@solana/errors';

import {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    DecompileTransactionMessageConfig,
} from '../..';
import { decompileTransactionMessage as decompileLegacyTransactionMessage } from '../legacy/message';
import { decompileTransactionMessage } from '../message';
import { decompileTransactionMessage as decompileV0TransactionMessage } from '../v0/message';

jest.mock('../legacy/message');
jest.mock('../v0/message');

describe('decompileTransactionMessage', () => {
    it('uses the legacy decompiler for legacy messages', () => {
        const mockTransactionMessage = { version: 'legacy' } as unknown as ReturnType<
            typeof decompileLegacyTransactionMessage
        >;
        jest.mocked(decompileLegacyTransactionMessage).mockReturnValue(mockTransactionMessage);

        const tx: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime & { version: 'legacy' } = {
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 0,
            },
            instructions: [],
            lifetimeToken: '',
            staticAccounts: [],
            version: 'legacy',
        };

        const config: DecompileTransactionMessageConfig = {
            lastValidBlockHeight: 123n,
        };

        expect(decompileLegacyTransactionMessage(tx, config)).toBe(mockTransactionMessage);
        expect(decompileLegacyTransactionMessage).toHaveBeenCalledTimes(1);
        expect(decompileLegacyTransactionMessage).toHaveBeenCalledWith(tx, config);
    });

    it('uses the v0 decompiler for v0 messages', () => {
        const mockTransactionMessage = { version: 0 } as unknown as ReturnType<typeof decompileV0TransactionMessage>;
        jest.mocked(decompileV0TransactionMessage).mockReturnValue(mockTransactionMessage);

        const tx: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime & { version: 0 } = {
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 0,
            },
            instructions: [],
            lifetimeToken: '',
            staticAccounts: [],
            version: 0,
        };

        const config: DecompileTransactionMessageConfig = {
            addressesByLookupTableAddress: {},
            lastValidBlockHeight: 123n,
        };

        expect(decompileV0TransactionMessage(tx, config)).toBe(mockTransactionMessage);
        expect(decompileV0TransactionMessage).toHaveBeenCalledTimes(1);
        expect(decompileV0TransactionMessage).toHaveBeenCalledWith(tx, config);
    });

    it('throws for unsupported v1 transaction', () => {
        const tx = {
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 0,
            },
            instructions: [],
            lifetimeToken: '',
            staticAccounts: [],
            version: 1,
        } as unknown as CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;

        expect(() => decompileTransactionMessage(tx)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
                version: 1,
            }),
        );
    });
});
