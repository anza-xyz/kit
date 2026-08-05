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

When you ask a signer (eg. a wallet) to sign an offchain message, it returns the message bytes it signed along with a signature. Checking that signature in isolation is **not** enough to trust the result: a compromised signer could hand back a perfectly valid signature over data that has nothing to do with what you asked it to sign. To trust the signature, you must _also_ confirm that the message the signer signed is the message you intended it to sign.

Those are two separate questions, and this package answers them with two functions:

| Question                          | Function                        |
| --------------------------------- | ------------------------------- |
| Is this the message I asked for?  | `assertOffchainMessageV1Equal`  |
| Are the signatures over it valid? | `verifyOffchainMessageEnvelope` |

```ts
import { address } from '@solana/addresses';
import { isSolanaError, SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED } from '@solana/errors';
import {
    assertOffchainMessageV1Equal,
    compileOffchainMessageV1Envelope,
    getOffchainMessageDecoder,
    verifyOffchainMessageEnvelope,
} from '@solana/offchain-messages';

const signerAddress = address(account.address);
const expectedMessage = {
    content: 'Sign in to Example App',
    requiredSignatories: [{ address: signerAddress }],
    version: 1,
} as const;

const [output] = await feature.signOffchainMessage({
    account,
    message: expectedMessage.content,
    messageVersion: 1,
    requiredSigners: [account.publicKey],
});

try {
    // 1. Did the wallet sign the message we asked for?
    const receivedMessage = getOffchainMessageDecoder().decode(output.signedOffchainMessage);
    if (receivedMessage.version !== 1) {
        throw new Error(`Expected the wallet to sign a version 1 message; got version ${receivedMessage.version}`);
    }
    assertOffchainMessageV1Equal(receivedMessage, expectedMessage);

    // 2. Is the signature valid, and is one present for every required signatory?
    await verifyOffchainMessageEnvelope({
        content: output.signedOffchainMessage,
        signatures: { [signerAddress]: output.signature },
    });
} catch (e) {
    if (isSolanaError(e, SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED)) {
        // The wallet signed something other than what you asked for. Do not trust it.
    }
    throw e;
}
```

`assertOffchainMessageV1Equal` compares the content and the required signatories, and reports each kind of mismatch with its own error code. Required signatories are compared without regard to order, since a decoded message always lists them in the order the specification mandates while yours may be in any order. Order is the only thing ignored: listing the same address twice is a mismatch rather than a no-op.

It is deliberately scoped to version 1 offchain messages — the only version the `solana:signOffchainMessage` wallet feature currently produces — and takes an `OffchainMessageV1` rather than the `OffchainMessage` union that decoding produces. That means you have to establish the version yourself, as above. This is on purpose: what to do about a message of some other version is your policy rather than ours, and it keeps the dispatch visible in your code so that a future version is something you decide about rather than something you inherit. If you would rather the compiler tell you when a new version appears, switch exhaustively on `version`:

```ts
switch (receivedMessage.version) {
    case 0:
        throw new Error('Expected the wallet to sign a version 1 message; got version 0');
    case 1:
        assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        break;
    default:
        receivedMessage satisfies never; // Fails to compile once a new version exists.
        throw new Error('Unrecognized offchain message version');
}
```

### Messages with more than one signer

A single `signOffchainMessage` call signs with a single account, so a message requiring several signatures means one call per signer. Each wallet hands back **its own copy** of the bytes it signed, so check each one rather than assuming they agree:

```ts
const requiredSigners = accounts.map(account => account.publicKey);
const expectedMessage = {
    content: 'Approve treasury withdrawal #42',
    requiredSignatories: accounts.map(account => ({ address: address(account.address) })),
    version: 1,
} as const;

const signatures = await Promise.all(
    accounts.map(async account => {
        const [output] = await featureFor(account).signOffchainMessage({
            account,
            message: expectedMessage.content,
            messageVersion: 1,
            requiredSigners,
        });
        const receivedMessage = getOffchainMessageDecoder().decode(output.signedOffchainMessage);
        if (receivedMessage.version !== 1) {
            throw new Error(`Expected a version 1 message; got version ${receivedMessage.version}`);
        }
        assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        return [address(account.address), output.signature] as const;
    }),
);

const envelope = compileOffchainMessageV1Envelope(expectedMessage);
await verifyOffchainMessageEnvelope({
    content: envelope.content,
    signatures: { ...envelope.signatures, ...Object.fromEntries(signatures) },
});
```
