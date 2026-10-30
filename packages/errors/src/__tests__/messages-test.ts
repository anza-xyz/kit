import { SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE } from '../codes';
import { SolanaErrorMessages } from '../messages';

describe('SolanaErrorMessages', () => {
    it('describes the actual printable ASCII range for restricted message bodies', () => {
        const message =
            SolanaErrorMessages[SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE];

        expect(message).toContain('compatibility');
        expect(message).toContain('[\\x20-\\x7e]');
        expect(message).not.toContain('line feeds');
    });
});
