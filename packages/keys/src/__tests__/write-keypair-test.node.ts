import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY, SolanaError } from '@solana/errors';

import { createKeyPairFromBytes, generateKeyPair } from '../key-pair';
import { createPrivateKeyFromBytes } from '../private-key';
import { getPublicKeyFromPrivateKey } from '../public-key';
import { writeKeyPair } from '../write-keypair';

const MOCK_PRIVATE_KEY_BYTES = new Uint8Array([
    0xeb, 0xfa, 0x65, 0xeb, 0x93, 0xdc, 0x79, 0x15, 0x7a, 0xba, 0xde, 0xa2, 0xf7, 0x94, 0x37, 0x9d, 0xfc, 0x07, 0x1d,
    0x68, 0x86, 0x87, 0x37, 0x6d, 0xc5, 0xd5, 0xa0, 0x54, 0x12, 0x1d, 0x34, 0x4a,
]);

describe('writeKeyPair', () => {
    let tmpDir: string;
    let mockKeyPair: CryptoKeyPair;
    let mockPublicKeyBytes: Uint8Array;
    beforeEach(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'kit-write-keypair-'));
        // Build an extractable key pair from the known private key bytes so we can assert exact file contents.
        const privateKey = await createPrivateKeyFromBytes(MOCK_PRIVATE_KEY_BYTES, /* extractable */ true);
        const publicKey = await getPublicKeyFromPrivateKey(privateKey, /* extractable */ true);
        mockKeyPair = { privateKey, publicKey };
        mockPublicKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', publicKey));
    });
    afterEach(async () => {
        await rm(tmpDir, { force: true, recursive: true });
    });
    it('writes the key pair to disk as a JSON array of 64 bytes', async () => {
        expect.assertions(1);
        const path = join(tmpDir, 'keypair.json');
        await writeKeyPair(mockKeyPair, path);
        const contents = await readFile(path, 'utf8');
        expect(JSON.parse(contents)).toEqual([...MOCK_PRIVATE_KEY_BYTES, ...mockPublicKeyBytes]);
    });
    it('writes bytes that can be round-tripped back through `createKeyPairFromBytes`', async () => {
        expect.assertions(1);
        const path = join(tmpDir, 'keypair.json');
        await writeKeyPair(mockKeyPair, path);
        const contents = await readFile(path, 'utf8');
        const recreatedKeyPair = await createKeyPairFromBytes(new Uint8Array(JSON.parse(contents)));
        const recreatedPublicKeyBytes = new Uint8Array(
            await crypto.subtle.exportKey('raw', recreatedKeyPair.publicKey),
        );
        expect(recreatedPublicKeyBytes).toEqual(mockPublicKeyBytes);
    });
    it('writes the file with owner-readable and owner-writable mode', async () => {
        expect.assertions(1);
        const path = join(tmpDir, 'keypair.json');
        await writeKeyPair(mockKeyPair, path);
        const stats = await stat(path);
        const mode = stats.mode & 0o777;
        // Windows does not honor POSIX mode bits: the `mode` option passed to
        // `fs.writeFile` is effectively ignored, and Node synthesizes the reported
        // `stats.mode` bits from the file's DOS attributes. On Windows we can only
        // verify that the file is readable and writable by its owner; on POSIX we
        // assert the exact `0o600` mode.
        // eslint-disable-next-line jest/no-conditional-in-test
        if (process.platform === 'win32') {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(mode & 0o600).toBe(0o600);
        } else {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(mode).toBe(0o600);
        }
    });
    it('creates missing parent directories recursively', async () => {
        expect.assertions(1);
        const path = join(tmpDir, 'nested', 'deeply', 'keypair.json');
        await writeKeyPair(mockKeyPair, path);
        const contents = await readFile(path, 'utf8');
        expect(JSON.parse(contents)).toEqual([...MOCK_PRIVATE_KEY_BYTES, ...mockPublicKeyBytes]);
    });
    it('throws when the private key is not extractable', async () => {
        expect.assertions(1);
        const nonExtractableKeyPair = await generateKeyPair(/* extractable */ false);
        await expect(writeKeyPair(nonExtractableKeyPair, join(tmpDir, 'keypair.json'))).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY, {
                key: nonExtractableKeyPair.privateKey,
            }),
        );
    });
    it('throws when the public key is not extractable', async () => {
        expect.assertions(1);
        const privateKey = await createPrivateKeyFromBytes(MOCK_PRIVATE_KEY_BYTES, /* extractable */ true);
        const publicKey = await getPublicKeyFromPrivateKey(privateKey, /* extractable */ false);
        const keyPair: CryptoKeyPair = { privateKey, publicKey };
        await expect(writeKeyPair(keyPair, join(tmpDir, 'keypair.json'))).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY, {
                key: publicKey,
            }),
        );
    });
    it('refuses to overwrite an existing file by default', async () => {
        expect.assertions(2);
        const path = join(tmpDir, 'keypair.json');
        await writeFile(path, 'pre-existing contents');
        await expect(writeKeyPair(mockKeyPair, path)).rejects.toThrow(expect.objectContaining({ code: 'EEXIST' }));
        // Verify the original file was not modified.
        await expect(readFile(path, 'utf8')).resolves.toBe('pre-existing contents');
    });
    it('overwrites an existing file when `unsafelyOverwriteExistingKeyPair` is set', async () => {
        expect.assertions(1);
        const path = join(tmpDir, 'keypair.json');
        await writeFile(path, 'pre-existing contents');
        await writeKeyPair(mockKeyPair, path, { unsafelyOverwriteExistingKeyPair: true });
        const contents = await readFile(path, 'utf8');
        expect(JSON.parse(contents)).toEqual([...MOCK_PRIVATE_KEY_BYTES, ...mockPublicKeyBytes]);
    });
});
