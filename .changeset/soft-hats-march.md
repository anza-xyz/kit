---
'@solana/webcrypto-ed25519-polyfill': patch
---

Fixed an issue in `signPolyfill` and `verifyPolyfill` where payloads supplied as a view other than a `Uint8Array` (for instance, a `DataView`) were read from the start of the underlying buffer instead of the viewed range, producing signatures over the wrong bytes.
