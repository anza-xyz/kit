import {
    SOLANA_ERROR__SUBTLE_CRYPTO__DIGEST_UNIMPLEMENTED,
    SOLANA_ERROR__SUBTLE_CRYPTO__DISALLOWED_IN_INSECURE_CONTEXT,
    SOLANA_ERROR__SUBTLE_CRYPTO__ED25519_ALGORITHM_UNIMPLEMENTED,
    SOLANA_ERROR__SUBTLE_CRYPTO__EXPORT_FUNCTION_UNIMPLEMENTED,
    SOLANA_ERROR__SUBTLE_CRYPTO__GENERATE_FUNCTION_UNIMPLEMENTED,
    SOLANA_ERROR__SUBTLE_CRYPTO__SIGN_FUNCTION_UNIMPLEMENTED,
    SOLANA_ERROR__SUBTLE_CRYPTO__VERIFY_FUNCTION_UNIMPLEMENTED,
    SolanaError,
} from '@solana/errors';

function assertIsSecureContext() {
    if (__BROWSER__ && !globalThis.isSecureContext) {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__DISALLOWED_IN_INSECURE_CONTEXT);
    }
}

let cachedEd25519Decision: PromiseLike<boolean> | boolean | undefined;
async function isEd25519CurveSupported(subtle: SubtleCrypto): Promise<boolean> {
    if (cachedEd25519Decision === undefined) {
        cachedEd25519Decision = new Promise(resolve => {
            subtle
                .generateKey('Ed25519', /* extractable */ false, ['sign', 'verify'])
                .then(() => {
                    resolve((cachedEd25519Decision = true));
                })
                .catch(() => {
                    resolve((cachedEd25519Decision = false));
                });
        });
    }
    if (typeof cachedEd25519Decision === 'boolean') {
        return cachedEd25519Decision;
    } else {
        return await cachedEd25519Decision;
    }
}

/**
 * Throws an exception unless {@link SubtleCrypto#digest | `crypto.subtle.digest()`} is available in
 * the current JavaScript environment.
 */
export function assertDigestCapabilityIsAvailable() {
    assertIsSecureContext();
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle?.digest !== 'function') {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__DIGEST_UNIMPLEMENTED);
    }
}

/**
 * Throws an exception unless {@link SubtleCrypto#generateKey | `crypto.subtle.generateKey()`} is
 * available in the current JavaScript environment and has support for the Ed25519 curve.
 */
export async function assertKeyGenerationIsAvailable() {
    assertIsSecureContext();
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle?.generateKey !== 'function') {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__GENERATE_FUNCTION_UNIMPLEMENTED);
    }
    if (!(await isEd25519CurveSupported(globalThis.crypto.subtle))) {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__ED25519_ALGORITHM_UNIMPLEMENTED);
    }
}

/**
 * Throws an exception unless {@link SubtleCrypto#exportKey | `crypto.subtle.exportKey()`} is
 * available in the current JavaScript environment.
 */
export function assertKeyExporterIsAvailable() {
    assertIsSecureContext();
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle?.exportKey !== 'function') {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__EXPORT_FUNCTION_UNIMPLEMENTED);
    }
}

/**
 * Throws an exception unless {@link SubtleCrypto#sign | `crypto.subtle.sign()`} is available in the
 * current JavaScript environment.
 */
export function assertSigningCapabilityIsAvailable() {
    assertIsSecureContext();
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle?.sign !== 'function') {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__SIGN_FUNCTION_UNIMPLEMENTED);
    }
}
/**
 * Throws an exception unless {@link SubtleCrypto#verify | `crypto.subtle.verify()`} is available in
 * the current JavaScript environment.
 */
export function assertVerificationCapabilityIsAvailable() {
    assertIsSecureContext();
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle?.verify !== 'function') {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__VERIFY_FUNCTION_UNIMPLEMENTED);
    }
}
