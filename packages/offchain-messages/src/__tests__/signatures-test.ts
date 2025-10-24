import '@solana/test-matchers/toBeFrozenObject';

import { Address, getAddressFromPublicKey } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__CODECS__INVALID_CONSTANT,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING,
    SolanaError,
} from '@solana/errors';
import { SignatureBytes, signBytes } from '@solana/keys';

import { OffchainMessageEnvelope } from '../envelope';
import { OffchainMessageBytes } from '../message';
import {
    assertIsFullySignedOffchainMessageEnvelope,
    isFullySignedOffchainMessageEnvelope,
    partiallySignOffchainMessageEnvelope,
    signOffchainMessageEnvelope,
} from '../signatures';

jest.mock('@solana/addresses', () => ({
    ...jest.requireActual('@solana/addresses'),
    __esModule: true,
    getAddressFromPublicKey: jest.fn(),
}));
jest.mock('@solana/keys');

// The string `'\xffsolana offchain'`
const OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES: ReadonlyUint8Array = new Uint8Array([
    0xff, 0x73, 0x6f, 0x6c, 0x61, 0x6e, 0x61, 0x20, 0x6f, 0x66, 0x66, 0x63, 0x68, 0x61, 0x69, 0x6e,
]);

const APPLICATION_DOMAIN_BYTES = new Uint8Array([
    0x0d, 0x3b, 0x73, 0x0b, 0x9e, 0x88, 0x9b, 0x4b, 0x66, 0x1e, 0xd2, 0xa3, 0xce, 0x19, 0x1f, 0x68, 0xd3, 0x7d, 0xa7,
    0x44, 0x32, 0x06, 0xa1, 0x82, 0xb9, 0x46, 0x89, 0x1e, 0x00, 0x00, 0x00, 0x00,
]);

const SIGNER_A_BYTES = new Uint8Array([
    0x0c, 0xfe, 0x2c, 0xc9, 0x52, 0x55, 0x0e, 0x94, 0xc7, 0x25, 0x63, 0x9a, 0x4b, 0xd1, 0x1d, 0x4e, 0xa5, 0xa6, 0x38,
    0x36, 0x51, 0xc3, 0x08, 0xb7, 0x18, 0xc3, 0xae, 0xf2, 0x86, 0xbc, 0xa1, 0xaf,
]);
const SIGNER_B_BYTES = new Uint8Array([
    0x0c, 0xfe, 0x2c, 0xc9, 0x52, 0x5c, 0x95, 0xef, 0xb9, 0x72, 0xc0, 0xc5, 0xb7, 0xae, 0x0f, 0xd5, 0x20, 0xd9, 0x7e,
    0x94, 0x8f, 0xd8, 0xbb, 0x2c, 0x10, 0xa1, 0x01, 0x02, 0xce, 0x98, 0xb3, 0xa6,
]);
const SIGNER_C_BYTES = new Uint8Array([
    0x0c, 0xfe, 0x2c, 0xc9, 0x52, 0x64, 0x1d, 0x4a, 0xab, 0xc0, 0x1d, 0xf1, 0x23, 0x8b, 0x02, 0x5b, 0x9c, 0x0c, 0xc4,
    0xf2, 0xcd, 0xee, 0x6d, 0xa1, 0x08, 0x7e, 0x53, 0x13, 0x16, 0x74, 0xc5, 0x9d,
]);

describe('partiallySignOffchainMessageEnvelope', () => {
    const MOCK_SIGNATURE_A = new Uint8Array(Array(64).fill(1)) as SignatureBytes;
    const MOCK_SIGNATURE_B = new Uint8Array(Array(64).fill(2)) as SignatureBytes;
    const MOCK_SIGNATURE_C = new Uint8Array(Array(64).fill(3)) as SignatureBytes;
    const MOCK_SIGNATURE_D = new Uint8Array(Array(64).fill(3)) as SignatureBytes;
    const MOCK_SIGNATURE_E = new Uint8Array(Array(64).fill(3)) as SignatureBytes;
    const mockKeyPairA = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockKeyPairB = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockKeyPairC = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockKeyPairD = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockKeyPairE = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockPublicKeyAddressA =
        'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address<'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'>;
    const mockPublicKeyAddressB =
        'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address<'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'>;
    const mockPublicKeyAddressC =
        'signerCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address<'signerCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'>;
    const mockPublicKeyAddressD =
        'signerDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' as Address<'signerDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD'>;
    const mockPublicKeyAddressE =
        'signerEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE' as Address<'signerEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE'>;
    const mockEncodedMessage =
        // prettier-ignore
        new Uint8Array([
            // Signing domain
            ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
            // Version
            0x00,
            // Application domain
            ...APPLICATION_DOMAIN_BYTES,
            // Message format (Restricted ASCII, 1232-byte-max)
            0x00,
            // Signer count
            0x03,
                // Signer addresses
                ...SIGNER_A_BYTES,
                ...SIGNER_B_BYTES,
                ...SIGNER_C_BYTES,
        ]) as ReadonlyUint8Array as OffchainMessageBytes;
    beforeEach(() => {
        (getAddressFromPublicKey as jest.Mock).mockImplementation(publicKey => {
            switch (publicKey) {
                case mockKeyPairA.publicKey:
                    return mockPublicKeyAddressA;
                case mockKeyPairB.publicKey:
                    return mockPublicKeyAddressB;
                case mockKeyPairC.publicKey:
                    return mockPublicKeyAddressC;
                case mockKeyPairD.publicKey:
                    return mockPublicKeyAddressD;
                case mockKeyPairE.publicKey:
                    return mockPublicKeyAddressE;
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
                case mockKeyPairD.privateKey:
                    return MOCK_SIGNATURE_D;
                case mockKeyPairE.privateKey:
                    return MOCK_SIGNATURE_E;
                default:
                    return new Uint8Array(Array(64).fill(0xff));
            }
        });
        (signBytes as jest.Mock).mockClear();
    });
    it('fatals when the message bytes do not begin with the signing domain', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content:
                // prettier-ignore
                new Uint8Array([
                    // Trying to trick you into signing a transaction message.
                    1, 0, 1, 2, 12, 254, 44, 201, 82, 85, 14, 148, 199, 37, 99, 154, 75, 209, 29, 78, 165, 166, 56, 54, 81, 195, 8, 183, 24, 195, 174, 242, 134, 188, 161, 175, 5, 74, 83, 90, 153, 41, 33, 6, 77, 36, 232, 113, 96, 218, 56, 124, 124, 53, 181, 221, 188, 146, 187, 129, 228, 31, 168, 64, 65, 5, 68, 141, 165, 245, 142, 160, 76, 82, 157, 113, 135, 56, 193, 165, 8, 243, 90, 59, 182, 100, 24, 27, 122, 61, 151, 206, 91, 112, 238, 152, 97, 89, 88, 36, 1, 1, 0, 11, 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100
                ]) as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
            },
        };
        await expect(partiallySignOffchainMessageEnvelope([mockKeyPairD], offchainMessageEnvelope)).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_CONSTANT, {
                constant: OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                data: offchainMessageEnvelope.content,
                hexConstant: 'ff736f6c616e61206f6666636861696e',
                hexData:
                    '010001020cfe2cc952550e94c725639a4bd11d4ea5a6383651c308b718c3aef286bca1af054a535a992921064d24e87160da387c7c35b5ddbc92bb81e41fa8404105448da5f58ea04c529d718738c1a508f35a3bb664181b7a3d97ce5b70ee98615958240101000b48656c6c6f20776f726c64',
                offset: 0,
            }),
        );
    });
    it("returns a signed OffchainMessageEnvelope object having the first signer's signature", async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: mockEncodedMessage,
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
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: mockEncodedMessage as ReadonlyUint8Array as OffchainMessageBytes,
            signatures: {
                [mockPublicKeyAddressA]: null,
            },
        };
        const partiallySignedOffchainMessageEnvelopePromise = partiallySignOffchainMessageEnvelope(
            [mockKeyPairA],
            offchainMessageEnvelope,
        );
        await expect(partiallySignedOffchainMessageEnvelopePromise).resolves.toHaveProperty(
            'content',
            mockEncodedMessage,
        );
    });
    it('returns a signed OffchainMessageEnvelope object having null for the missing signers', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
            signatures: {
                [mockPublicKeyAddressA]: null,
            },
        };
        await expect(partiallySignOffchainMessageEnvelope([mockKeyPairD], offchainMessageEnvelope)).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE, {
                expectedAddresses: [mockPublicKeyAddressA],
                unexpectedAddresses: [mockPublicKeyAddressD],
            }),
        );
    });
    it('throws with multiple addresses if there are multiple keypairs that are not in the signatures', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: mockEncodedMessage,
            signatures: {
                [mockPublicKeyAddressA]: null,
            },
        };
        await expect(
            partiallySignOffchainMessageEnvelope([mockKeyPairD, mockKeyPairE], offchainMessageEnvelope),
        ).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE, {
                expectedAddresses: [mockPublicKeyAddressA],
                unexpectedAddresses: [mockPublicKeyAddressD, mockPublicKeyAddressE],
            }),
        );
    });
});

describe('signOffchainMessageEnvelope', () => {
    const mockPublicKeyAddressA =
        'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address<'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'>;
    const mockPublicKeyAddressB =
        'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address<'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'>;
    const MOCK_SIGNATURE_A = new Uint8Array(Array(64).fill(1)) as SignatureBytes;
    const MOCK_SIGNATURE_B = new Uint8Array(Array(64).fill(2)) as SignatureBytes;
    const mockKeyPairA = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockKeyPairB = { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey } as CryptoKeyPair;
    const mockEncodedMessage =
        // prettier-ignore
        new Uint8Array([
            // Signing domain
            ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
            // Version
            0x00,
            // Application domain
            ...APPLICATION_DOMAIN_BYTES,
            // Message format (Restricted ASCII, 1232-byte-max)
            0x00,
            // Signer count
            0x02,
                // Signer addresses
                ...SIGNER_A_BYTES,
                ...SIGNER_B_BYTES,
        ]) as ReadonlyUint8Array as OffchainMessageBytes;
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
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: mockEncodedMessage,
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
            'content',
            mockEncodedMessage,
        );
    });
    it('stores the signatures in the order specified on the compiled message', async () => {
        expect.assertions(1);
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: mockEncodedMessage,
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
            content: mockEncodedMessage,
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
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        signatures[mockPublicKeyAddressA] = null;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(isFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).toBe(false);
    });

    it('returns true if the OffchainMessageEnvelope is signed by all its signers', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        signatures[mockPublicKeyAddressA] = mockSignatureA;
        signatures[mockPublicKeyAddressB] = mockSignatureB;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(isFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).toBe(true);
    });

    it('return true if the OffchainMessageEnvelope has no signatures', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
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
        const signatures: OffchainMessageEnvelope['signatures'] = {};
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
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        signatures[mockPublicKeyAddressA] = mockSignatureA;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).not.toThrow();
    });

    it('does not throw if the OffchainMessageEnvelope is signed by all its signers', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        signatures[mockPublicKeyAddressA] = mockSignatureA;
        signatures[mockPublicKeyAddressB] = mockSignatureB;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).not.toThrow();
    });

    it('does not throw if the OffchainMessageEnvelope has no signatures', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };
        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).not.toThrow();
    });
});
