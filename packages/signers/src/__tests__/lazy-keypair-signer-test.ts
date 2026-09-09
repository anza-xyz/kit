import '@solana/test-matchers/toBeFrozenObject';

import { getAddressDecoder, getAddressFromPublicKey } from '@solana/addresses';
import { SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH, SolanaError } from '@solana/errors';
import { createKeyPairFromBytes, SignatureBytes, signBytes } from '@solana/keys';
import {
    partiallySignTransaction,
    Transaction,
    TransactionWithinSizeLimit,
    TransactionWithLifetime,
} from '@solana/transactions';

import { createLazyKeyPairSignerFromBytes } from '../lazy-keypair-signer';
import { createSignableMessage } from '../signable-message';

// Partial mocks of the async crypto boundary that the lazy signer defers to.
jest.mock('@solana/addresses', () => ({
    ...jest.requireActual('@solana/addresses'),
    getAddressFromPublicKey: jest.fn(),
}));
jest.mock('@solana/keys', () => ({
    ...jest.requireActual('@solana/keys'),
    createKeyPairFromBytes: jest.fn(),
    signBytes: jest.fn(),
}));
jest.mock('@solana/transactions', () => ({
    ...jest.requireActual('@solana/transactions'),
    partiallySignTransaction: jest.fn(),
}));

// A valid 64-byte secret key (private key + public key).
const MOCK_KEY_BYTES = new Uint8Array([
    0xeb, 0xfa, 0x65, 0xeb, 0x93, 0xdc, 0x79, 0x15, 0x7a, 0xba, 0xde, 0xa2, 0xf7, 0x94, 0x37, 0x9d, 0xfc, 0x07, 0x1d,
    0x68, 0x86, 0x87, 0x37, 0x6d, 0xc5, 0xd5, 0xa0, 0x54, 0x12, 0x1d, 0x34, 0x4a, 0x1d, 0x0e, 0x93, 0x86, 0x4d, 0xcc,
    0x81, 0x5f, 0xc3, 0xf2, 0x86, 0x18, 0x09, 0x11, 0xd0, 0x0a, 0x3f, 0xd2, 0x06, 0xde, 0x31, 0xa1, 0xc9, 0x42, 0x87,
    0xcb, 0x43, 0xf0, 0x5f, 0xc9, 0xf2, 0xb5,
]);

// The address is the base58 encoding of the last 32 bytes (the public key half).
const EXPECTED_ADDRESS = getAddressDecoder().decode(MOCK_KEY_BYTES.slice(32));

const getMockCryptoKeyPair = () => ({ privateKey: {}, publicKey: {} }) as CryptoKeyPair;

describe('createLazyKeyPairSignerFromBytes', () => {
    beforeEach(() => {
        // By default, the deferred crypto boundary resolves to a mock key pair and address.
        jest.mocked(createKeyPairFromBytes).mockResolvedValue(getMockCryptoKeyPair());
        jest.mocked(getAddressFromPublicKey).mockResolvedValue(EXPECTED_ADDRESS);
    });

    it('derives the address synchronously from the public key half of the secret key', () => {
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);
        expect(signer.address).toBe(EXPECTED_ADDRESS);
    });

    it('returns a frozen signer implementing both partial signer interfaces', () => {
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);
        expect(signer).toBeFrozenObject();
        expect(typeof signer.signMessages).toBe('function');
        expect(typeof signer.signTransactions).toBe('function');
    });

    it('does not expose a keyPair property', () => {
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);
        expect(signer).not.toHaveProperty('keyPair');
    });

    it('throws synchronously when the secret key is not 64 bytes long', () => {
        expect(() => createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES.slice(0, 63))).toThrow(
            new SolanaError(SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH, { byteLength: 63 }),
        );
    });

    it('defers the key pair import until the first signature is requested', async () => {
        expect.assertions(2);
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);

        // The import has not happened yet.
        expect(jest.mocked(createKeyPairFromBytes)).not.toHaveBeenCalled();

        await signer.signTransactions([]);
        expect(jest.mocked(createKeyPairFromBytes)).toHaveBeenCalledTimes(1);
    });

    it('imports the key pair only once across multiple sequential signing calls', async () => {
        expect.assertions(1);
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);

        await signer.signTransactions([]);
        await signer.signTransactions([]);
        await signer.signMessages([]);

        expect(jest.mocked(createKeyPairFromBytes)).toHaveBeenCalledTimes(1);
    });

    it('imports the key pair only once across concurrent signing calls', async () => {
        expect.assertions(1);
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);

        // Because the promise (not just its result) is memoised, concurrent calls share one import.
        await Promise.all([signer.signTransactions([]), signer.signMessages([]), signer.signTransactions([])]);

        expect(jest.mocked(createKeyPairFromBytes)).toHaveBeenCalledTimes(1);
    });

    it('forwards the extractable option to the underlying key pair import', async () => {
        expect.assertions(1);
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES, true);

        await signer.signTransactions([]);

        expect(jest.mocked(createKeyPairFromBytes)).toHaveBeenCalledWith(expect.any(Uint8Array), true);
    });

    it('zeroes its internal copy of the secret key once the import succeeds', async () => {
        expect.assertions(2);
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);

        await signer.signTransactions([]);

        // Grab the exact byte array the import received (Jest stores the reference).
        const importedBytes = jest.mocked(createKeyPairFromBytes).mock.calls[0][0] as Uint8Array;
        expect(importedBytes).toHaveLength(64);
        expect([...importedBytes].every(byte => byte === 0)).toBe(true);
    });

    it('retries the import on a subsequent call when the first import fails', async () => {
        expect.assertions(3);
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);

        // The first import fails, so the first signing attempt rejects.
        jest.mocked(createKeyPairFromBytes).mockRejectedValueOnce(new Error('Transient failure'));
        await expect(signer.signTransactions([])).rejects.toThrow('Transient failure');

        // The failure is not cached, so a second attempt re-imports and succeeds.
        await expect(signer.signTransactions([])).resolves.toBeDefined();
        expect(jest.mocked(createKeyPairFromBytes)).toHaveBeenCalledTimes(2);
    });

    it('signs messages by delegating to the deferred key pair', async () => {
        expect.assertions(2);
        const mockSignature = new Uint8Array([101, 101, 101]) as SignatureBytes;
        jest.mocked(signBytes).mockResolvedValue(mockSignature);
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);

        const messages = [createSignableMessage(new Uint8Array([1, 2, 3]))];
        const [signatures] = await signer.signMessages(messages);

        expect(signatures).toStrictEqual({ [EXPECTED_ADDRESS]: mockSignature });
        expect(jest.mocked(signBytes)).toHaveBeenCalledTimes(1);
    });

    it('signs transactions by delegating to the deferred key pair', async () => {
        expect.assertions(2);
        const mockTransaction = {} as Transaction & TransactionWithinSizeLimit & TransactionWithLifetime;
        const mockSignature = new Uint8Array([201, 201, 201]) as SignatureBytes;
        jest.mocked(partiallySignTransaction).mockResolvedValue({
            ...mockTransaction,
            signatures: { [EXPECTED_ADDRESS]: mockSignature },
        });
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);

        const [signatures] = await signer.signTransactions([mockTransaction]);

        expect(signatures).toStrictEqual({ [EXPECTED_ADDRESS]: mockSignature });
        expect(jest.mocked(partiallySignTransaction)).toHaveBeenCalledTimes(1);
    });

    it('constructs synchronously but rejects on the first signing attempt when the import fails', async () => {
        expect.assertions(2);
        // Simulate the deferred validation failing (e.g. mismatched public/private key halves).
        jest.mocked(createKeyPairFromBytes).mockRejectedValue(new Error('Invalid key pair'));
        const signer = createLazyKeyPairSignerFromBytes(MOCK_KEY_BYTES);

        // Construction still succeeded synchronously.
        expect(signer.address).toBe(EXPECTED_ADDRESS);

        // The failure surfaces on the first signing attempt.
        await expect(signer.signTransactions([])).rejects.toThrow('Invalid key pair');
    });
});
