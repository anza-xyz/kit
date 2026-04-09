import { writeKeyPair, WriteKeyPairConfig } from '@solana/keys';

import { KeyPairSigner } from './keypair-signer';

export type { WriteKeyPairConfig };

/**
 * Writes the {@link CryptoKeyPair} backing a {@link KeyPairSigner} to disk as a JSON array
 * of 64 bytes, matching the format produced by `solana-keygen`. The first 32 bytes are the
 * raw Ed25519 seed (private key) and the last 32 bytes are the raw public key.
 *
 * Any missing parent directories are created automatically. The written file uses mode
 * `0600` (owner read/write only) to match `solana-keygen`.
 *
 * This helper requires a writable filesystem and will throw in environments that don't
 * provide one (such as browsers or React Native).
 *
 * @param signer - A {@link KeyPairSigner} whose underlying {@link CryptoKeyPair} is
 * extractable (i.e. created via `generateKeyPairSigner(true)` or
 * `createKeyPairSignerFromBytes(bytes, true)`).
 * @param path - The destination path on disk.
 * @param config - See {@link WriteKeyPairConfig}.
 *
 * @throws A {@link SolanaError} of code
 * `SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT` when called in an
 * environment without a writable filesystem.
 * @throws A {@link SolanaError} of code
 * `SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY` when the signer's
 * underlying key pair is not extractable.
 *
 * @example
 * ```ts
 * import { generateKeyPairSigner, writeKeyPairSigner } from '@solana/signers';
 *
 * // Generate an extractable signer so its bytes can be persisted.
 * const signer = await generateKeyPairSigner(true);
 * await writeKeyPairSigner(signer, './my-keypair.json');
 * ```
 *
 * @example
 * Overwriting an existing file requires an explicit opt-in, because doing so permanently
 * destroys the previous key and any funds controlled by it:
 * ```ts
 * import { writeKeyPairSigner } from '@solana/signers';
 *
 * await writeKeyPairSigner(signer, './my-keypair.json', {
 *     unsafelyOverwriteExistingKeyPair: true,
 * });
 * ```
 *
 * @see {@link writeKeyPair} — the lower-level helper from `@solana/keys` that operates on
 * a raw {@link CryptoKeyPair}.
 * @see {@link createKeyPairSignerFromBytes} — the inverse helper that loads a signer from
 * a 64-byte buffer.
 */
export async function writeKeyPairSigner(
    signer: KeyPairSigner,
    path: string,
    config?: WriteKeyPairConfig,
): Promise<void> {
    return await writeKeyPair(signer.keyPair, path, config);
}
