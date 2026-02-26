import { Address } from '@solana/addresses';
import { SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_FEE_PAYER_MISSING, SolanaError } from '@solana/errors';

import { getFeePayer } from '../fee-payer';

describe('getFeePayer', () => {
    it('should return the fee payer from the compiled transaction message', () => {
        const staticAccounts = ['fee-payer' as Address, 'account1' as Address, 'account2' as Address];
        const feePayer = getFeePayer(staticAccounts);
        expect(feePayer).toBe('fee-payer');
    });

    it('should throw when staticAccounts is empty', () => {
        const staticAccounts: Address[] = [];
        expect(() => getFeePayer(staticAccounts)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_FEE_PAYER_MISSING),
        );
    });
});
