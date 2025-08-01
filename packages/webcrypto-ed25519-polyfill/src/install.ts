import cryptoImpl from '@solana/crypto-impl';

import {
    exportKeyPolyfill,
    generateKeyPolyfill,
    importKeyPolyfill,
    isPolyfilledKey,
    signPolyfill,
    verifyPolyfill,
} from './secrets';

function isAlgorithmEd25519(putativeEd25519Algorithm: AlgorithmIdentifier): boolean {
    const name =
        typeof putativeEd25519Algorithm === 'string' ? putativeEd25519Algorithm : putativeEd25519Algorithm.name;
    return name.localeCompare('Ed25519', 'en-US', { sensitivity: 'base' }) === 0;
}

/**
 * Polyfills methods on `globalThis.SubtleCrypto` to add support for the Ed25519 algorithm.
 *
 * @example
 * ```ts
 * import { install } from '@solana/webcrypto-ed25519-polyfill';
 *
 * // Calling this will shim methods on `SubtleCrypto`, adding Ed25519 support.
 * install();
 *
 * // Now you can do this, in environments that do not otherwise support Ed25519.
 * const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign']);
 * const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey);
 * const data = new Uint8Array([1, 2, 3]);
 * const signature = await crypto.subtle.sign({ name: 'Ed25519' }, keyPair.privateKey, data);
 * if (await crypto.subtle.verify({ name: 'Ed25519' }, keyPair.publicKey, signature, data)) {
 *     console.log('Data was signed using the private key associated with this public key');
 * } else {
 *     throw new Error('Signature verification error');
 * }
 * ```
 */
export function install() {
    if (__NODEJS__) {
        /**
         * Node only sets the `crypto` global variable when run with `--experimental-global-webcrypto`.
         * Let's set it unconditionally here.
         */
        globalThis.crypto ||= cryptoImpl;
    }

    if (!__BROWSER__ || globalThis.isSecureContext) {
        /**
         * Create `crypto.subtle` if it doesn't exist.
         */
        const originalCryptoObject = (globalThis.crypto ||= {} as Crypto);
        const originalSubtleCrypto = ((originalCryptoObject as Crypto & { subtle: SubtleCrypto }).subtle ||=
            {} as SubtleCrypto);

        /**
         * Override `SubtleCrypto#exportKey`
         */
        const originalExportKey = originalSubtleCrypto.exportKey as SubtleCrypto['exportKey'] | undefined;
        originalSubtleCrypto.exportKey = (async (...args: Parameters<SubtleCrypto['exportKey']>) => {
            const [_, key] = args;
            if (isPolyfilledKey(key)) {
                return await exportKeyPolyfill(...args);
            } else if (originalExportKey) {
                return await originalExportKey.apply(originalSubtleCrypto, args);
            } else {
                throw new TypeError('No native `exportKey` function exists to handle this call');
            }
        }) as SubtleCrypto['exportKey'];

        /**
         * Override `SubtleCrypto#generateKey`
         */
        const originalGenerateKey = originalSubtleCrypto.generateKey as SubtleCrypto['generateKey'] | undefined;
        let originalGenerateKeySupportsEd25519: Promise<boolean> | boolean | undefined;
        originalSubtleCrypto.generateKey = (async (...args: Parameters<SubtleCrypto['generateKey']>) => {
            const [algorithm] = args;
            if (!isAlgorithmEd25519(algorithm)) {
                if (originalGenerateKey) {
                    return await originalGenerateKey.apply(originalSubtleCrypto, args);
                } else {
                    throw new TypeError('No native `generateKey` function exists to handle this call');
                }
            }
            let optimisticallyGeneratedKeyPair;
            if (originalGenerateKeySupportsEd25519 === undefined) {
                originalGenerateKeySupportsEd25519 = new Promise(resolve => {
                    if (!originalGenerateKey) {
                        resolve((originalGenerateKeySupportsEd25519 = false));
                        return;
                    }
                    originalGenerateKey
                        .apply(originalSubtleCrypto, args)
                        .then(keyPair => {
                            if (__DEV__) {
                                console.warn(
                                    '`@solana/webcrypto-ed25519-polyfill` was installed in an ' +
                                        'environment that supports Ed25519 key manipulation ' +
                                        'natively. Falling back to the native implementation. ' +
                                        'Consider installing this polyfill only in environments where ' +
                                        'Ed25519 is not supported.',
                                );
                            }
                            if (originalSubtleCrypto.generateKey !== originalGenerateKey) {
                                originalSubtleCrypto.generateKey = originalGenerateKey;
                            }
                            optimisticallyGeneratedKeyPair = keyPair;
                            resolve((originalGenerateKeySupportsEd25519 = true));
                        })
                        .catch(() => {
                            resolve((originalGenerateKeySupportsEd25519 = false));
                        });
                });
            }
            if (
                typeof originalGenerateKeySupportsEd25519 === 'boolean'
                    ? originalGenerateKeySupportsEd25519
                    : await originalGenerateKeySupportsEd25519
            ) {
                if (optimisticallyGeneratedKeyPair) {
                    return optimisticallyGeneratedKeyPair;
                } else if (originalGenerateKey) {
                    return await originalGenerateKey.apply(originalSubtleCrypto, args);
                } else {
                    throw new TypeError('No native `generateKey` function exists to handle this call');
                }
            } else {
                const [_, extractable, keyUsages] = args;
                return generateKeyPolyfill(extractable, keyUsages);
            }
        }) as SubtleCrypto['generateKey'];

        /**
         * Override `SubtleCrypto#sign`
         */
        const originalSign = originalSubtleCrypto.sign as SubtleCrypto['sign'] | undefined;
        originalSubtleCrypto.sign = (async (...args: Parameters<SubtleCrypto['sign']>) => {
            const [_, key] = args;
            if (isPolyfilledKey(key)) {
                const [_, ...rest] = args;
                return await signPolyfill(...rest);
            } else if (originalSign) {
                return await originalSign.apply(originalSubtleCrypto, args);
            } else {
                throw new TypeError('No native `sign` function exists to handle this call');
            }
        }) as SubtleCrypto['sign'];

        /**
         * Override `SubtleCrypto#verify`
         */
        const originalVerify = originalSubtleCrypto.verify as SubtleCrypto['verify'] | undefined;
        originalSubtleCrypto.verify = (async (...args: Parameters<SubtleCrypto['verify']>) => {
            const [_, key] = args;
            if (isPolyfilledKey(key)) {
                const [_, ...rest] = args;
                return await verifyPolyfill(...rest);
            } else if (originalVerify) {
                return await originalVerify.apply(originalSubtleCrypto, args);
            } else {
                throw new TypeError('No native `verify` function exists to handle this call');
            }
        }) as SubtleCrypto['verify'];

        /**
         * Override `SubtleCrypto#importKey`
         */
        const originalImportKey = originalSubtleCrypto.importKey as SubtleCrypto['importKey'] | undefined;
        let originalImportKeySupportsEd25519: Promise<boolean> | boolean | undefined;
        originalSubtleCrypto.importKey = (async (...args: Parameters<SubtleCrypto['importKey']>) => {
            const [format, keyData, algorithm] = args;
            if (!isAlgorithmEd25519(algorithm)) {
                if (originalImportKey) {
                    return await originalImportKey.apply(originalSubtleCrypto, args);
                } else {
                    throw new TypeError('No native `importKey` function exists to handle this call');
                }
            }
            let optimisticallyImportedKey;
            if (originalImportKeySupportsEd25519 === undefined) {
                originalImportKeySupportsEd25519 = new Promise(resolve => {
                    if (!originalImportKey) {
                        resolve((originalImportKeySupportsEd25519 = false));
                        return;
                    }
                    originalImportKey
                        .apply(originalSubtleCrypto, args)
                        .then(key => {
                            if (__DEV__) {
                                console.warn(
                                    '`@solana/webcrypto-ed25519-polyfill` was included in an ' +
                                        'environment that supports Ed25519 key manipulation ' +
                                        'natively. Falling back to the native implementation. ' +
                                        'Consider including this polyfill only in environments where ' +
                                        'Ed25519 is not supported.',
                                );
                            }
                            if (originalSubtleCrypto.importKey !== originalImportKey) {
                                originalSubtleCrypto.importKey = originalImportKey;
                            }
                            optimisticallyImportedKey = key;
                            resolve((originalImportKeySupportsEd25519 = true));
                        })
                        .catch(() => {
                            resolve((originalImportKeySupportsEd25519 = false));
                        });
                });
            }
            if (
                typeof originalImportKey === 'boolean'
                    ? originalImportKeySupportsEd25519
                    : await originalImportKeySupportsEd25519
            ) {
                if (optimisticallyImportedKey) {
                    return optimisticallyImportedKey;
                } else if (originalImportKey) {
                    return await originalImportKey.apply(originalSubtleCrypto, args);
                } else {
                    throw new TypeError('No native `importKey` function exists to handle this call');
                }
            } else {
                const [_format, _keyData, _algorithm, extractable, keyUsages] = args;
                return importKeyPolyfill(format, keyData, extractable, keyUsages);
            }
        }) as SubtleCrypto['importKey'];
    }
}
