import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY, SolanaError } from '@solana/errors';
import { generateKeyPair, writeKeyPair } from '@solana/keys';

import { createSignerFromKeyPair, generateKeyPairSigner, KeyPairSigner } from '../keypair-signer';
import { writeKeyPairSigner } from '../write-keypair-signer';

describe('writeKeyPairSigner', () => {
    let tmpDir: string;
    let signer: KeyPairSigner;
    beforeEach(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'kit-write-keypair-signer-'));
        signer = await generateKeyPairSigner(/* extractable */ true);
    });
    afterEach(async () => {
        await rm(tmpDir, { force: true, recursive: true });
    });
    it("produces the same file contents as `writeKeyPair` called with the signer's underlying key pair", async () => {
        expect.assertions(1);
        const signerPath = join(tmpDir, 'signer.json');
        const keyPairPath = join(tmpDir, 'keypair.json');
        await writeKeyPairSigner(signer, signerPath);
        await writeKeyPair(signer.keyPair, keyPairPath);
        const [signerContents, keyPairContents] = await Promise.all([
            readFile(signerPath, 'utf8'),
            readFile(keyPairPath, 'utf8'),
        ]);
        expect(signerContents).toBe(keyPairContents);
    });
    it('refuses to overwrite an existing file by default', async () => {
        expect.assertions(2);
        const path = join(tmpDir, 'signer.json');
        await writeFile(path, 'pre-existing contents');
        await expect(writeKeyPairSigner(signer, path)).rejects.toThrow(expect.objectContaining({ code: 'EEXIST' }));
        await expect(readFile(path, 'utf8')).resolves.toBe('pre-existing contents');
    });
    it('overwrites an existing file when `unsafelyOverwriteExistingKeyPair` is set', async () => {
        expect.assertions(1);
        const path = join(tmpDir, 'signer.json');
        await writeFile(path, 'pre-existing contents');
        await writeKeyPairSigner(signer, path, { unsafelyOverwriteExistingKeyPair: true });
        const contents = await readFile(path, 'utf8');
        expect(JSON.parse(contents)).toHaveLength(64);
    });
    it("throws when the signer's key pair is not extractable", async () => {
        expect.assertions(1);
        const nonExtractableKeyPair = await generateKeyPair(/* extractable */ false);
        const nonExtractableSigner = await createSignerFromKeyPair(nonExtractableKeyPair);
        await expect(writeKeyPairSigner(nonExtractableSigner, join(tmpDir, 'signer.json'))).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY, {
                key: nonExtractableKeyPair.privateKey,
            }),
        );
    });
});
