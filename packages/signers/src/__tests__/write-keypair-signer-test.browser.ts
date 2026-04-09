import { SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT, SolanaError } from '@solana/errors';

import { generateKeyPairSigner } from '../keypair-signer';
import { writeKeyPairSigner } from '../write-keypair-signer';

describe('writeKeyPairSigner', () => {
    it('throws with `SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT` when called outside Node', async () => {
        expect.assertions(1);
        const signer = await generateKeyPairSigner(/* extractable */ true);
        await expect(writeKeyPairSigner(signer, '/fake/path/keypair.json')).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT),
        );
    });
});
