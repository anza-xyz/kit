import { address, getAddressFromPublicKey } from '@solana/addresses';
import { grindKeyPairs } from '@solana/keys';

import { grindKeyPairSigner, grindKeyPairSigners } from '../grind-keypair-signer';
import { KeyPairSigner } from '../keypair-signer';

// Partial mocks.
jest.mock('@solana/addresses', () => ({
    ...jest.requireActual('@solana/addresses'),
    getAddressFromPublicKey: jest.fn(),
}));
jest.mock('@solana/keys', () => ({
    ...jest.requireActual('@solana/keys'),
    grindKeyPairs: jest.fn(),
}));

const getMockCryptoKeyPair = () => ({ privateKey: {}, publicKey: {} }) as CryptoKeyPair;

describe('grindKeyPairSigner', () => {
    it('returns a single `KeyPairSigner` whose `keyPair` comes from `grindKeyPairs`', async () => {
        expect.assertions(3);

        const mockKeyPair = getMockCryptoKeyPair();
        const mockAddress = address('soidJbjQLKFQvcXLTT3AbddEPupBw5LsQv5w6mZqgxT');
        jest.mocked(grindKeyPairs).mockResolvedValueOnce([mockKeyPair]);
        jest.mocked(getAddressFromPublicKey).mockResolvedValueOnce(mockAddress);

        const signer = await grindKeyPairSigner({ matches: /^so/ });
        signer satisfies KeyPairSigner;

        expect(signer.keyPair).toBe(mockKeyPair);
        expect(signer.address).toBe(mockAddress);
        expect(jest.mocked(grindKeyPairs)).toHaveBeenCalledTimes(1);
    });

    it('forwards config fields to `grindKeyPairs` with `amount: 1`', async () => {
        expect.assertions(1);

        const mockKeyPair = getMockCryptoKeyPair();
        jest.mocked(grindKeyPairs).mockResolvedValueOnce([mockKeyPair]);
        jest.mocked(getAddressFromPublicKey).mockResolvedValueOnce(
            address('soidJbjQLKFQvcXLTT3AbddEPupBw5LsQv5w6mZqgxT'),
        );

        const abortController = new AbortController();
        const matches = /^so/;
        await grindKeyPairSigner({
            abortSignal: abortController.signal,
            concurrency: 8,
            extractable: true,
            matches,
        });

        expect(jest.mocked(grindKeyPairs)).toHaveBeenCalledWith({
            abortSignal: abortController.signal,
            amount: 1,
            concurrency: 8,
            extractable: true,
            matches,
        });
    });

    it('propagates errors from `grindKeyPairs`', async () => {
        expect.assertions(1);
        const error = new Error('Cancelled');
        jest.mocked(grindKeyPairs).mockRejectedValueOnce(error);
        await expect(grindKeyPairSigner({ matches: () => true })).rejects.toThrow('Cancelled');
    });
});

describe('grindKeyPairSigners', () => {
    it('returns one `KeyPairSigner` per key pair returned by `grindKeyPairs`', async () => {
        expect.assertions(4);

        const mockKeyPairs = [getMockCryptoKeyPair(), getMockCryptoKeyPair(), getMockCryptoKeyPair()];
        const mockAddresses = [
            address('soidJbjQLKFQvcXLTT3AbddEPupBw5LsQv5w6mZqgxT'),
            address('soTEku193tpVTyiqVFyyS4iUnrCH3WByTaarHmRvtVV'),
            address('so5Rqdrtb31G2cDDgdDyBmEWk2C4K2ryfwASZPQAcYw'),
        ];
        jest.mocked(grindKeyPairs).mockResolvedValueOnce(mockKeyPairs);
        jest.mocked(getAddressFromPublicKey)
            .mockResolvedValueOnce(mockAddresses[0])
            .mockResolvedValueOnce(mockAddresses[1])
            .mockResolvedValueOnce(mockAddresses[2]);

        const signers = await grindKeyPairSigners({ amount: 3, matches: /^so/ });

        expect(signers).toHaveLength(3);
        for (let i = 0; i < 3; i++) {
            expect(signers[i]).toMatchObject({
                address: mockAddresses[i],
                keyPair: mockKeyPairs[i],
            });
        }
    });

    it('forwards config directly to `grindKeyPairs`', async () => {
        expect.assertions(1);

        jest.mocked(grindKeyPairs).mockResolvedValueOnce([]);

        const abortController = new AbortController();
        const matches = (addr: string) => addr.startsWith('so');
        await grindKeyPairSigners({
            abortSignal: abortController.signal,
            amount: 5,
            concurrency: 16,
            extractable: true,
            matches,
        });

        expect(jest.mocked(grindKeyPairs)).toHaveBeenCalledWith({
            abortSignal: abortController.signal,
            amount: 5,
            concurrency: 16,
            extractable: true,
            matches,
        });
    });

    it('returns an empty array when `grindKeyPairs` returns an empty array', async () => {
        expect.assertions(1);
        jest.mocked(grindKeyPairs).mockResolvedValueOnce([]);
        const signers = await grindKeyPairSigners({ amount: 0, matches: () => true });
        expect(signers).toEqual([]);
    });

    it('propagates errors from `grindKeyPairs`', async () => {
        expect.assertions(1);
        const error = new Error('Cancelled');
        jest.mocked(grindKeyPairs).mockRejectedValueOnce(error);
        await expect(grindKeyPairSigners({ amount: 3, matches: () => true })).rejects.toThrow('Cancelled');
    });
});
