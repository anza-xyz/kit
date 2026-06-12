import type { Address } from '@solana/addresses';
import type { CompiledTransactionMessage } from '@solana/transaction-messages';

import { getAllAddressesFromCompiledTransactionMessage } from '../get-all-addresses';

describe('getAllAddressesFromCompiledTransactionMessage', () => {
    const compiled = {
        staticAccounts: ['static-1' as Address, 'static-2' as Address],
    } as CompiledTransactionMessage;

    it('returns only static accounts when no loaded addresses are supplied', () => {
        expect(getAllAddressesFromCompiledTransactionMessage(compiled)).toStrictEqual(['static-1', 'static-2']);
    });

    it('returns static accounts followed by writable then readonly loaded addresses', () => {
        expect(
            getAllAddressesFromCompiledTransactionMessage(compiled, {
                readonly: ['alt-readonly-1' as Address],
                writable: ['alt-writable-1' as Address, 'alt-writable-2' as Address],
            }),
        ).toStrictEqual(['static-1', 'static-2', 'alt-writable-1', 'alt-writable-2', 'alt-readonly-1']);
    });

    it('treats null loaded addresses the same as omitted', () => {
        expect(getAllAddressesFromCompiledTransactionMessage(compiled, null)).toStrictEqual(['static-1', 'static-2']);
    });
});
