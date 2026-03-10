import { SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, SolanaError } from '@solana/errors';

import {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    DecompileTransactionMessageConfig,
} from '../..';
import { decompileTransactionMessage as decompileLegacyTransactionMessage } from '../legacy/message';
import { decompileTransactionMessage } from '../message';
import { decompileTransactionMessage as decompileV0TransactionMessage } from '../v0/message';
import { decompileTransactionMessage as decompileV1TransactionMessage } from '../v1/message';

jest.mock('../legacy/message');
jest.mock('../v0/message');
jest.mock('../v1/message');

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

    it('uses the v1 decompiler for v1 messages', () => {
        const mockTransactionMessage = { version: 1 } as unknown as ReturnType<typeof decompileV1TransactionMessage>;
        jest.mocked(decompileV1TransactionMessage).mockReturnValue(mockTransactionMessage);

        const tx: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime & { version: 1 } = {
            configMask: 0,
            configValues: [],
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 0,
            },
            instructionHeaders: [],
            instructionPayloads: [],
            lifetimeToken: '',
            numInstructions: 0,
            numStaticAccounts: 0,
            staticAccounts: [],
            version: 1,
        };

        const config: DecompileTransactionMessageConfig = {
            addressesByLookupTableAddress: {},
            lastValidBlockHeight: 123n,
        };

        expect(decompileV1TransactionMessage(tx, config)).toBe(mockTransactionMessage);
        expect(decompileV1TransactionMessage).toHaveBeenCalledTimes(1);
        expect(decompileV1TransactionMessage).toHaveBeenCalledWith(tx, config);
    });

    it('throws for unsupported v2 transaction', () => {
        const tx = {
            version: 2,
        } as unknown as CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;

        expect(() => decompileTransactionMessage(tx)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
                version: 2,
            }),
        );
    });
});
