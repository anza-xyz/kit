---
'@solana/webcrypto-ed25519-polyfill': patch
---

The Ed25519 polyfill now correctly returns `ArrayBuffer` from `exportKey()` and `sign()` rather than `Uint8Array`
