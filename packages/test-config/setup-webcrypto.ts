import crypto from 'node:crypto';

import { protectProperties } from 'jest-util';

if (typeof globalThis.crypto === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', {
        value: crypto.webcrypto,
        writable: true, // Allow tests to delete it.
    });
    protectProperties(globalThis['crypto']);
}
if (typeof globalThis.crypto.subtle === 'undefined') {
    Object.defineProperty(globalThis.crypto, 'subtle', {
        value: crypto.webcrypto.subtle,
    });
    protectProperties(globalThis['crypto']['subtle']);
}
