---
'@solana/codecs-numbers': patch
'@solana/codecs-strings': patch
'@solana/codecs-core': patch
'@solana/compat': patch
'@solana/keys': patch
---

Any `SharedArrayBuffer` that gets passed to a crypto operation like `signBytes` or `verifySignature` will now be copied as non-shared. Crypto operations like `sign` and `verify` reject `SharedArrayBuffers` otherwise
