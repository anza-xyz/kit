import '@solana/test-matchers/toBeFrozenObject';

import { Address, getAddressFromPublicKey } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING,
    SolanaError,
} from '@solana/errors';
import { SignatureBytes, signBytes } from '@solana/keys';

import { OffchainMessageEnvelope, OffchainMessageSignaturesMap } from '../envelope';
import { OffchainMessageBytes } from '../message';
import {
    assertIsFullySignedOffchainMessageEnvelope,
    isFullySignedOffchainMessageEnvelope,
    partiallySignOffchainMessageEnvelope,
    signOffchainMessageEnvelope,
} from '../signatures';

jest.mock('@solana/addresses');
jest.mock('@solana/keys');

describe('partiallySignOffchainMessageEnvelope', () => {
    const MOCK_SIGNATURE_A = new Uint8Array(Array(64).fill(1)) as SignatureBytes;
    const MOCK_SIGNATURE_B = new Uint8Array(Array(64).fill(2)) as SignatureBytes;
    const MOCK_SIGNATURE_C = new Uint8Array(Array(64).fill(3)) as SignatureBytes;
    const mockKeyPairA = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockKeyPairB = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockKeyPairC = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockPublicKeyAddressA = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address<'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'>;
    const mockPublicKeyAddressB = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address<'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'>;
    const mockPublicKeyAddressC = 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address<'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'>;
    beforeEach(() => {
        (getAddressFromPublicKey as jest.Mock).mockImplementation(publicKey => {
            switch (publicKey) {
                case mockKeyPairA.publicKey:
                    return mockPublicKeyAddressA;
                case mockKeyPairB.publicKey:
                    return mockPublicKeyAddressB;
                case mockKeyPairC.publicKey:
                    return mockPublicKeyAddressC;
                default:
                    return '99999999999999999999999999999999' as Address<'99999999999999999999999999999999'>;
            }
        });
        (signBytes as jest.Mock).mockImplementation(secretKey => {
            switch (secretKey) {
                case mockKeyPairA.privateKey:
                    return MOCK_SIGNATURE_A;
                case mockKeyPairB.privateKey:
                    return MOCK_SIGNATURE_B;
                case mockKeyPairC.privateKey:
                    return MOCK_SIGNATURE_C;
                default:
                    return new Uint8Array(Array(64).fill(0xff));
            }
        });
        (signBytes as jest.Mock).mockClear();
    });
    it("returns a signed OffchainMessageEnvelope object having the first signer's signature", async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
            },
        };

        const partiallySignedOffchainMessageEnvelopePromise = partiallySignOffchainMessageEnvelope(
            [mockKeyPairA],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty(
            'signatures',
            expect.objectContaining({
                [mockPublicKeyAddressA]: MOCK_SIGNATURE_A,
            }),
        );
    });
    it('returns unchanged compiled message bytes', async () => {
        expect.assertions(1);
        const content = new Uint8Array([1, 2, 3]) as ReadonlyUint8Array as OffchainMessageBytes;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: content as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
            },
        };
        const partiallySignedOffchainMessageEnvelopePromise = partiallySignOffchainMessageEnvelope(
            [mockKeyPairA],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty('content', content);
    });
    it('returns a signed OffchainMessageEnvelope object having null for the missing signers', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
                [mockPublicKeyAddressB]: null,
                [mockPublicKeyAddressC]: null,
            },
        };
        const partiallySignedOffchainMessageEnvelopePromise = partiallySignOffchainMessageEnvelope(
            [mockKeyPairA],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty(
            'signatures',
            expect.objectContaining({
                [mockPublicKeyAddressB]: null,
                [mockPublicKeyAddressC]: null,
            }),
        );
    });
    it("returns a OffchainMessageEnvelope object having the second signer's signature", async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
                [mockPublicKeyAddressB]: null,
            },
        };
        const partiallySignedOffchainMessageEnvelopePromise = partiallySignOffchainMessageEnvelope(
            [mockKeyPairB],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty(
            'signatures',
            expect.objectContaining({
                [mockPublicKeyAddressB]: MOCK_SIGNATURE_B,
            }),
        );
    });
    it('returns a OffchainMessageEnvelope object having multiple signatures', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
                [mockPublicKeyAddressB]: null,
                [mockPublicKeyAddressC]: null,
            },
        };
        const partiallySignedOffchainMessageEnvelopePromise = partiallySignOffchainMessageEnvelope(
            [mockKeyPairA, mockKeyPairB, mockKeyPairC],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty(
            'signatures',
            expect.objectContaining({
                [mockPublicKeyAddressA]: MOCK_SIGNATURE_A,
                [mockPublicKeyAddressB]: MOCK_SIGNATURE_B,
                [mockPublicKeyAddressC]: MOCK_SIGNATURE_C,
            }),
        );
    });
    it('stores the signatures in the order specified on the compiled message', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
                [mockPublicKeyAddressB]: null,
                [mockPublicKeyAddressC]: null,
            },
        };
        const { signatures } = await partiallySignOffchainMessageEnvelope(
            [mockKeyPairC, mockKeyPairB, mockKeyPairA],
            offchainMessageEnvelope,
        );
        const orderedAddresses = Object.keys(signatures);
        expect(orderedAddresses).toEqual([mockPublicKeyAddressA, mockPublicKeyAddressB, mockPublicKeyAddressC]);
    });
    it('does not modify an existing signature when the signature is the same', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: MOCK_SIGNATURE_A,
                [mockPublicKeyAddressB]: null,
            },
        };
        const partiallySignedOffchainMessageEnvelopePromise = partiallySignOffchainMessageEnvelope(
            [mockKeyPairB],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty(
            'signatures',
            expect.objectContaining({
                [mockPublicKeyAddressA]: MOCK_SIGNATURE_A,
            }),
        );
    });
    it('produces a new signature for an existing signer', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: MOCK_SIGNATURE_A,
            },
        };
        await partiallySignOffchainMessageEnvelope([mockKeyPairA], offchainMessageEnvelope);
        expect(signBytes as jest.Mock).toHaveBeenCalledTimes(1);
    });
    it('modifies the existing signature when the signature is different', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: new Uint8Array([1, 2, 3, 4]) as ReadonlyUint8Array as SignatureBytes,
            },
        };
        const partiallySignedOffchainMessageEnvelopePromise = partiallySignOffchainMessageEnvelope(
            [mockKeyPairA],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty(
            'signatures',
            expect.objectContaining({
                [mockPublicKeyAddressA]: MOCK_SIGNATURE_A,
            }),
        );
    });
    it('produces a signature for a new signer when there is an existing one', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: MOCK_SIGNATURE_A,
                [mockPublicKeyAddressB]: null,
            },
        };
        const partiallySignedOffchainMessageEnvelopePromise = partiallySignOffchainMessageEnvelope(
            [mockKeyPairB],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty(
            'signatures',
            expect.objectContaining({
                [mockPublicKeyAddressB]: MOCK_SIGNATURE_B,
            }),
        );
    });
    it('freezes the object', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
            },
        };
        await expect(
            partiallySignOffchainMessageEnvelope([mockKeyPairA], offchainMessageEnvelope),
        ).resolves.toBeFrozenObject();
    });
    it('returns the input OffchainMessageEnvelope object if no signatures changed', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: MOCK_SIGNATURE_A,
            },
        };
        await expect(partiallySignOffchainMessageEnvelope([mockKeyPairA], offchainMessageEnvelope)).resolves.toBe(
            offchainMessageEnvelope,
        );
    });
    it('throws if a keypair is for an address that is not in the signatures of the OffchainMessageEnvelope', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
            },
        };
        await expect(partiallySignOffchainMessageEnvelope([mockKeyPairB], offchainMessageEnvelope)).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE, {
                expectedAddresses: [mockPublicKeyAddressA],
                unexpectedAddresses: [mockPublicKeyAddressB],
            }),
        );
    });
    it('throws with multiple addresses if there are multiple keypairs that are not in the signatures', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
            },
        };
        await expect(
            partiallySignOffchainMessageEnvelope([mockKeyPairB, mockKeyPairC], offchainMessageEnvelope),
        ).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE, {
                expectedAddresses: [mockPublicKeyAddressA],
                unexpectedAddresses: [mockPublicKeyAddressB, mockPublicKeyAddressC],
            }),
        );
    });
});

describe('signOffchainMessageEnvelope', () => {
    const mockPublicKeyAddressA = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address<'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'>;
    const mockPublicKeyAddressB = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address<'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'>;
    const MOCK_SIGNATURE_A = new Uint8Array(Array(64).fill(1)) as SignatureBytes;
    const MOCK_SIGNATURE_B = new Uint8Array(Array(64).fill(2)) as SignatureBytes;
    const mockKeyPairA = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockKeyPairB = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    beforeEach(() => {
        (getAddressFromPublicKey as jest.Mock).mockImplementation(publicKey => {
            switch (publicKey) {
                case mockKeyPairA.publicKey:
                    return mockPublicKeyAddressA;
                case mockKeyPairB.publicKey:
                    return mockPublicKeyAddressB;
                default:
                    return '99999999999999999999999999999999' as Address<'99999999999999999999999999999999'>;
            }
        });
        (signBytes as jest.Mock).mockImplementation(secretKey => {
            switch (secretKey) {
                case mockKeyPairA.privateKey:
                    return MOCK_SIGNATURE_A;
                case mockKeyPairB.privateKey:
                    return MOCK_SIGNATURE_B;
                default:
                    return new Uint8Array(Array(64).fill(0xff));
            }
        });
    });
    it('fatals when missing a signer', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
                [mockPublicKeyAddressB]: null,
            },
        };
        const signedOffchainMessageEnvelopePromise = signOffchainMessageEnvelope(
            [mockKeyPairA],
            offchainMessageEnvelope,
        );
        await expect(signedOffchainMessageEnvelopePromise).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING, {
                addresses: [mockPublicKeyAddressB],
            }),
        );
    });
    it('returns a signed OffchainMessageEnvelope object with multiple signatures', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
                [mockPublicKeyAddressB]: null,
            },
        };
        const partiallySignedOffchainMessageEnvelopePromise = signOffchainMessageEnvelope(
            [mockKeyPairA, mockKeyPairB],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty(
            'signatures',
            expect.objectContaining({
                [mockPublicKeyAddressA]: MOCK_SIGNATURE_A,
                [mockPublicKeyAddressB]: MOCK_SIGNATURE_B,
            }),
        );
    });
    it('returns a signed OffchainMessageEnvelope object with the compiled message bytes', async () => {
        expect.assertions(1);
        const content = new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content,
            signatures: {
                [mockPublicKeyAddressA]: null,
                [mockPublicKeyAddressB]: null,
            },
        };
        const partiallySignedOffchainMessageEnvelopePromise = signOffchainMessageEnvelope(
            [mockKeyPairA, mockKeyPairB],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty('content', content);
    });
    it('stores the signatures in the order specified on the compiled message', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
                [mockPublicKeyAddressB]: null,
            },
        };
        const { signatures } = await signOffchainMessageEnvelope([mockKeyPairB, mockKeyPairA], offchainMessageEnvelope);
        const orderedAddresses = Object.keys(signatures);
        expect(orderedAddresses).toEqual([mockPublicKeyAddressA, mockPublicKeyAddressB]);
    });
    it('freezes the object', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
                [mockPublicKeyAddressB]: null,
            },
        };
        await expect(
            signOffchainMessageEnvelope([mockKeyPairA, mockKeyPairB], offchainMessageEnvelope),
        ).resolves.toBeFrozenObject();
    });
});

describe('isFullySignedOffchainMessageEnvelope', () => {
    const mockPublicKeyAddressA = 'A' as Address;
    const mockSignatureA = new Uint8Array(0) as SignatureBytes;
    const mockPublicKeyAddressB = 'B' as Address;
    const mockSignatureB = new Uint8Array(1) as SignatureBytes;

    it('returns false if the OffchainMessageEnvelope has missing signatures', () => {
        const signatures: OffchainMessageSignaturesMap = {};
        signatures[mockPublicKeyAddressA] = null;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(isFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).toBe(false);
    });

    it('returns true if the OffchainMessageEnvelope is signed by all its signers', () => {
        const signatures: OffchainMessageSignaturesMap = {};
        signatures[mockPublicKeyAddressA] = mockSignatureA;
        signatures[mockPublicKeyAddressB] = mockSignatureB;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(isFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).toBe(true);
    });

    it('return true if the OffchainMessageEnvelope has no signatures', () => {
        const signatures: OffchainMessageSignaturesMap = {};
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(isFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).toBe(true);
    });
});

describe('assertIsFullySignedOffchainMessageEnvelope', () => {
    const mockPublicKeyAddressA = 'A' as Address;
    const mockSignatureA = new Uint8Array(0) as SignatureBytes;
    const mockPublicKeyAddressB = 'B' as Address;
    const mockSignatureB = new Uint8Array(1) as SignatureBytes;

    it('throws all missing signers if the OffchainMessageEnvelope has no signature for multiple signers', () => {
        const signatures: OffchainMessageSignaturesMap = {};
        signatures[mockPublicKeyAddressA] = null;
        signatures[mockPublicKeyAddressB] = null;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING, {
                addresses: [mockPublicKeyAddressA, mockPublicKeyAddressB],
            }),
        );
    });

    it('does not throw if the OffchainMessageEnvelope is signed by its only signer', () => {
        const signatures: OffchainMessageSignaturesMap = {};
        signatures[mockPublicKeyAddressA] = mockSignatureA;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).not.toThrow();
    });

    it('does not throw if the OffchainMessageEnvelope is signed by all its signers', () => {
        const signatures: OffchainMessageSignaturesMap = {};
        signatures[mockPublicKeyAddressA] = mockSignatureA;
        signatures[mockPublicKeyAddressB] = mockSignatureB;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).not.toThrow();
    });

    it('does not throw if the OffchainMessageEnvelope has no signatures', () => {
        const signatures: OffchainMessageSignaturesMap = {};
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };
        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).not.toThrow();
    });
});
