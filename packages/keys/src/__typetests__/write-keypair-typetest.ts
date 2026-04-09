/* eslint-disable @typescript-eslint/no-floating-promises */
import { writeKeyPair } from '../write-keypair';

// [DESCRIBE] writeKeyPair
{
    const keyPair = null as unknown as CryptoKeyPair;

    // It accepts a key pair and a path
    {
        writeKeyPair(keyPair, './keypair.json') satisfies Promise<void>;
    }

    // It accepts an optional config argument
    {
        writeKeyPair(keyPair, './keypair.json', {}) satisfies Promise<void>;
        writeKeyPair(keyPair, './keypair.json', { unsafelyOverwriteExistingKeyPair: true }) satisfies Promise<void>;
        writeKeyPair(keyPair, './keypair.json', { unsafelyOverwriteExistingKeyPair: false }) satisfies Promise<void>;
    }
}
