import { ReadonlyUint8Array } from '@solana/codecs-core';
import { SOLANA_ERROR__KEYS__INVALID_PRIVATE_KEY_BYTE_LENGTH, SolanaError } from '@solana/errors';

import { ED25519_ALGORITHM_IDENTIFIER } from './algorithm';

function addPkcs8Header(bytes: ReadonlyUint8Array): ReadonlyUint8Array {
    // prettier-ignore
    return new Uint8Array([
        /**
         * PKCS#8 header
         */
        0x30, // ASN.1 sequence tag
        0x2e, // Length of sequence (46 more bytes)

            0x02, // ASN.1 integer tag
            0x01, // Length of integer
                0x00, // Version number

            0x30, // ASN.1 sequence tag
            0x05, // Length of sequence
                0x06, // ASN.1 object identifier tag
                0x03, // Length of object identifier
                    // Edwards curve algorithms identifier https://oid-rep.orange-labs.fr/get/1.3.101.112
                        0x2b, // iso(1) / identified-organization(3) (The first node is multiplied by the decimal 40 and the result is added to the value of the second node)
                        0x65, // thawte(101)
                    // Ed25519 identifier
                        0x70, // id-Ed25519(112)

        /**
         * Private key payload
         */
        0x04, // ASN.1 octet string tag
        0x22, // String length (34 more bytes)

            // Private key bytes as octet string
            0x04, // ASN.1 octet string tag
            0x20, // String length (32 bytes)

        ...bytes
    ]);
}

/**
 * Given a private key represented as a 32-byte `Uint8Array`, creates an Ed25519 private key for use
 * with other methods in this package that accept
 * [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey) objects.
 *
 * @param bytes 32 bytes that represent the private key
 * @param extractable Setting this to `true` makes it possible to extract the bytes of the private
 * key using the [`crypto.subtle.exportKey()`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey)
 * API. Defaults to `false`.
 *
 * @example
 * ```ts
 * import { createPrivateKeyFromBytes } from '@solana/keys';
 *
 * const privateKey = await createPrivateKeyFromBytes(new Uint8Array([...]));
 * const extractablePrivateKey = await createPrivateKeyFromBytes(new Uint8Array([...]), true);
 * ```
 */
export async function createPrivateKeyFromBytes(
    bytes: ReadonlyUint8Array,
    extractable: boolean = false,
): Promise<CryptoKey> {
    const actualLength = bytes.byteLength;
    if (actualLength !== 32) {
        throw new SolanaError(SOLANA_ERROR__KEYS__INVALID_PRIVATE_KEY_BYTE_LENGTH, {
            actualLength,
        });
    }
    const privateKeyBytesPkcs8 = addPkcs8Header(bytes);
    return await crypto.subtle.importKey('pkcs8', privateKeyBytesPkcs8, ED25519_ALGORITHM_IDENTIFIER, extractable, [
        'sign',
    ]);
}
