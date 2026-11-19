import { Keypair } from '@solana/web3.js';

import { fromLegacyPublicKey } from '../address';

describe('fromLegacyPublicKey', () => {
    it('should convert from a Legacy Web3 JS PublicKey to an `Address`', async () => {
        expect.assertions(1);
        const { publicKey } = await Keypair.generate();
        expect(publicKey.toBase58()).toEqual(fromLegacyPublicKey(publicKey));
    });
});
