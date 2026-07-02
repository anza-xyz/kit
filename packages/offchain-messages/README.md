[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/offchain-messages?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/offchain-messages?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/offchain-messages

# @solana/offchain-messages

This package contains utilities for encoding and decoding messages according to the offchain message [specification](https://github.com/solana-foundation/SRFCs/discussions/3). It can be used standalone, but it is also exported as part of Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).

## Verifying a signed offchain message

When you ask a signer (eg. a wallet) to sign an offchain message, it typically returns the message bytes it signed along with a signature. Checking that signature in isolation is **not** enough to trust the result: a compromised signer could hand back a perfectly valid signature over data that has nothing to do with what you asked it to sign. To trust the signature, you must _also_ confirm that the bytes the signer signed are the bytes you intended it to sign.

The `verifyOffchainMessage` helper performs both checks in a single call. From the `message` and required signers you requested, it reconstructs and encodes the version 1 offchain message you expected the signer to sign, asserts that it matches the bytes the signer reports having signed, and then asserts that the signature is a valid Ed25519 signature of those bytes by the signer. It supports version 1 offchain messages — the only version the `solana:signOffchainMessage` wallet feature produces.

For the common case — a connected wallet signing a message only it needs to sign — you just pass the `message`, the wallet's `signer`, and the `signature` + `signedMessageBytes` it returned. `requiredSigners` is optional and defaults to `[signer]`. You never construct a fully-formed offchain message yourself, because reconstructing the expected bytes already enforces the spec's structural rules (non-empty and duplicate-free signers, serialized in the spec-mandated order, and non-empty content), so a malformed request throws before any comparison happens.

```ts
import { address } from '@solana/addresses';
import {
    isSolanaError,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE,
} from '@solana/errors';
import { verifyOffchainMessage } from '@solana/offchain-messages';

// `message` is what you asked the wallet to sign.
// `signedOffchainMessage` and `signature` came back from the wallet.
try {
    await verifyOffchainMessage({
        message,
        signature,
        signedMessageBytes: signedOffchainMessage,
        signer: address(account.address),
    });
    // The wallet signed exactly the message you expected, and the signature is valid.
} catch (e) {
    if (isSolanaError(e, SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED)) {
        // The signer signed something other than what you asked for. Do not trust it.
    } else if (isSolanaError(e, SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE)) {
        // The signature is not valid for the signed bytes and signer.
    }
    throw e;
}
```

When a message requires more than one signer, every signer signs the same bytes and the wallet returns one signature per signer. Pass the full `requiredSigners` set (so the expected bytes can be reconstructed) and call `verifyOffchainMessage` once per signature you collect, each time with the `signer` that produced it.

If you instead hold a fully assembled [`OffchainMessageEnvelope`](./src/envelope.ts) (eg. you signed it yourself with `signOffchainMessageEnvelope`), use `verifyOffchainMessageEnvelope` to assert that it is signed by all of its required signatories.
