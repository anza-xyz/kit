import { SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT, SolanaError } from '@solana/errors';

import { generateKeyPair } from '../key-pair';
import { writeKeyPair } from '../write-keypair';

describe('writeKeyPair', () => {
    it('throws with `SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT` when called outside Node', async () => {
        expect.assertions(1);
        const keyPair = await generateKeyPair(/* extractable */ true);
        await expect(writeKeyPair(keyPair, '/fake/path/keypair.json')).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT),
        );
    });
});
