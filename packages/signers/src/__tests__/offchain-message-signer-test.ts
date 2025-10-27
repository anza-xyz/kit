import { Address } from '@solana/addresses';

import { getSignersFromOffchainMessage } from '../offchain-message-signer';
import { createMockMessageModifyingSigner, createMockMessagePartialSigner } from './__setup__';

describe('getSignersFromOffchainMessage', () => {
    it('extracts signers from the required signatories of the provided message', () => {
        const signerA = createMockMessagePartialSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        const signerB = createMockMessageModifyingSigner('signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address);
        const extractedSigners = getSignersFromOffchainMessage({
            requiredSignatories: [signerA, signerB],
        });

        expect(extractedSigners).toHaveLength(2);
        expect(extractedSigners[0]).toBe(signerA);
        expect(extractedSigners[1]).toBe(signerB);
    });

    it('removes duplicated signers by reference', () => {
        const signerA = createMockMessagePartialSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        const signerB = createMockMessageModifyingSigner('signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address);
        const extractedSigners = getSignersFromOffchainMessage({
            requiredSignatories: [signerA, signerB, signerA, { address: signerA.address }],
        });

        expect(extractedSigners).toHaveLength(2);
        expect(extractedSigners.map(signer => signer.address).sort()).toStrictEqual([
            'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
        ]);
    });
});
