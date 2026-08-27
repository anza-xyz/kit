# @solana/offchain-messages

## 8.1.0

### Patch Changes

- Updated dependencies [[`be30e32`](https://github.com/anza-xyz/kit/commit/be30e328304ed055817572fb67712d79454ca12e), [`6852054`](https://github.com/anza-xyz/kit/commit/68520546649225b6594fe1137ff54ab6609c6d06), [`7d56e29`](https://github.com/anza-xyz/kit/commit/7d56e29bcd5f38fb53300e03e039d4d329a9e04f), [`c51b9f6`](https://github.com/anza-xyz/kit/commit/c51b9f645f7d007568d38e79f5ab6ff2f5f77f7f)]:
    - @solana/codecs-core@8.1.0
    - @solana/codecs-strings@8.1.0
    - @solana/errors@8.1.0
    - @solana/codecs-data-structures@8.1.0
    - @solana/addresses@8.1.0
    - @solana/codecs-numbers@8.1.0
    - @solana/keys@8.1.0
    - @solana/nominal-types@8.1.0

## 8.0.0

### Patch Changes

- Updated dependencies [[`1b30374`](https://github.com/anza-xyz/kit/commit/1b303745dac8ba87e84dfb8d120ba8642ac66e4b), [`cb09af6`](https://github.com/anza-xyz/kit/commit/cb09af68d23207d3b75974d2f971dacb7f72c0cb)]:
    - @solana/codecs-core@8.0.0
    - @solana/errors@8.0.0
    - @solana/addresses@8.0.0
    - @solana/codecs-data-structures@8.0.0
    - @solana/codecs-numbers@8.0.0
    - @solana/codecs-strings@8.0.0
    - @solana/keys@8.0.0
    - @solana/nominal-types@8.0.0

## 7.1.1

### Patch Changes

- Updated dependencies [[`1d074ed`](https://github.com/anza-xyz/kit/commit/1d074ed874c9ad8ba03d3498be212956695db34e)]:
    - @solana/codecs-strings@7.1.1
    - @solana/addresses@7.1.1
    - @solana/codecs-data-structures@7.1.1
    - @solana/keys@7.1.1
    - @solana/codecs-core@7.1.1
    - @solana/codecs-numbers@7.1.1
    - @solana/errors@7.1.1
    - @solana/nominal-types@7.1.1

## 7.1.0

### Minor Changes

- [#1888](https://github.com/anza-xyz/kit/pull/1888) [`14a3e5b`](https://github.com/anza-xyz/kit/commit/14a3e5b600e6a034749616fb25f762aed01a7a43) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add an `assertOffchainMessageV1Equal` helper that asserts that a version 1 offchain message you received from an untrusted signer (eg. a wallet) is the message you expected it to sign. Verifying a signature proves only that the signer produced it over the bytes it handed back, not that those bytes represent the message you asked for, so assert this before verifying signatures with `verifyOffchainMessageEnvelope`. The helper compares the content and the required signatories, and reports each kind of mismatch with its own error code: the new `SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED` and `SOLANA_ERROR__OFFCHAIN_MESSAGE__REQUIRED_SIGNATORIES_DO_NOT_MATCH_EXPECTED`. Required signatories are compared without regard to order, since a decoded message lists them in the order the specification mandates while yours may be in any order. It accepts an `OffchainMessageV1` rather than the `OffchainMessage` union that decoding produces, so narrow the decoded message to a version 1 message before calling it.

### Patch Changes

- Updated dependencies [[`7022c26`](https://github.com/anza-xyz/kit/commit/7022c262ba75bdd243c148c4f0759c2546159b6f), [`8c9eece`](https://github.com/anza-xyz/kit/commit/8c9eece4fc91bd070320b78449aae00e476a42f4), [`da10c5a`](https://github.com/anza-xyz/kit/commit/da10c5a0d94283ca27fbb3cde676d3ab1883541c), [`204ed6e`](https://github.com/anza-xyz/kit/commit/204ed6e19bbf87e39184bf1f2201c91d155e3e0c), [`14a3e5b`](https://github.com/anza-xyz/kit/commit/14a3e5b600e6a034749616fb25f762aed01a7a43)]:
    - @solana/errors@7.1.0
    - @solana/codecs-data-structures@7.1.0
    - @solana/addresses@7.1.0
    - @solana/codecs-core@7.1.0
    - @solana/codecs-numbers@7.1.0
    - @solana/codecs-strings@7.1.0
    - @solana/keys@7.1.0
    - @solana/nominal-types@7.1.0

## 7.0.0

### Patch Changes

- Updated dependencies [[`3014977`](https://github.com/anza-xyz/kit/commit/30149771475d45b6cfff1c4aacd16c8f7256e256), [`ec4d3ef`](https://github.com/anza-xyz/kit/commit/ec4d3ef7192a437ecbdc7103aa1c95556dbd7f5f), [`772b82c`](https://github.com/anza-xyz/kit/commit/772b82c4f18c418100560a5010b17e6b40dd7ab3), [`e193711`](https://github.com/anza-xyz/kit/commit/e1937110a3eb300e184b10732f82ccfefe9c2a3f), [`069d56d`](https://github.com/anza-xyz/kit/commit/069d56d69226f755412b282c22818cbc90f2db4f), [`99667a1`](https://github.com/anza-xyz/kit/commit/99667a1ea9b0d3b3f227f4cccb2c4b5ba734eb83)]:
    - @solana/errors@7.0.0
    - @solana/codecs-data-structures@7.0.0
    - @solana/addresses@7.0.0
    - @solana/codecs-core@7.0.0
    - @solana/codecs-numbers@7.0.0
    - @solana/codecs-strings@7.0.0
    - @solana/keys@7.0.0
    - @solana/nominal-types@7.0.0

## 6.10.0

### Patch Changes

- [#1741](https://github.com/anza-xyz/kit/pull/1741) [`6c2c903`](https://github.com/anza-xyz/kit/commit/6c2c903d0eb573aa2c7bf179c7f005c9ee6f4db6) Thanks [@ChargingFoxSec](https://github.com/ChargingFoxSec)! - Include the v0 preamble bytes when enforcing the 1232-byte limit for hardware-wallet-signable offchain messages.

- Updated dependencies [[`c318d7f`](https://github.com/anza-xyz/kit/commit/c318d7f2e16fec92859503af41102792be01cece), [`460557b`](https://github.com/anza-xyz/kit/commit/460557b9f706f22aa384cb175deeb45c30081166), [`40e0848`](https://github.com/anza-xyz/kit/commit/40e084878ca49f37f38065c8b2f64f1b62454f36), [`47a785b`](https://github.com/anza-xyz/kit/commit/47a785bdb47f89443cccb69151650974d0f57f65), [`6b499ee`](https://github.com/anza-xyz/kit/commit/6b499ee38a3f695951a8505f23964839fd308b3d), [`74b8d3d`](https://github.com/anza-xyz/kit/commit/74b8d3d5166b4857ab722eae0ec5e2843e480a4b)]:
    - @solana/errors@6.10.0
    - @solana/addresses@6.10.0
    - @solana/codecs-core@6.10.0
    - @solana/codecs-data-structures@6.10.0
    - @solana/codecs-numbers@6.10.0
    - @solana/codecs-strings@6.10.0
    - @solana/keys@6.10.0
    - @solana/nominal-types@6.10.0

## 6.9.0

### Minor Changes

- [#1562](https://github.com/anza-xyz/kit/pull/1562) [`096c48e`](https://github.com/anza-xyz/kit/commit/096c48e6771ad7ea833cb4ca51206b7cc827a3d7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump the TypeScript peer dependency floor from `>=5.0.0` to `>=5.4.0`.

### Patch Changes

- Updated dependencies [[`92126f4`](https://github.com/anza-xyz/kit/commit/92126f438afff8b7521f827cf0e92b1d2cd69c55), [`a5ef97b`](https://github.com/anza-xyz/kit/commit/a5ef97b17fe747de1e2bee0189ed44e20c0f6c40), [`e82e03e`](https://github.com/anza-xyz/kit/commit/e82e03eb0e982db74f96d11b9aa8fefb4f0038c3), [`096c48e`](https://github.com/anza-xyz/kit/commit/096c48e6771ad7ea833cb4ca51206b7cc827a3d7)]:
    - @solana/errors@6.9.0
    - @solana/addresses@6.9.0
    - @solana/codecs-core@6.9.0
    - @solana/codecs-data-structures@6.9.0
    - @solana/codecs-numbers@6.9.0
    - @solana/codecs-strings@6.9.0
    - @solana/keys@6.9.0
    - @solana/nominal-types@6.9.0

## 6.8.0

### Patch Changes

- [#1532](https://github.com/anza-xyz/kit/pull/1532) [`667a0f0`](https://github.com/anza-xyz/kit/commit/667a0f059f5432244ab2cf8a23a22f53c7a36b4b) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Update the TypeScript peer dependency from `^5.0.0` to `>=5.0.0` to allow TypeScript 6 and above.

- Updated dependencies [[`d79f8d1`](https://github.com/anza-xyz/kit/commit/d79f8d115065557194db9604f3a0bfef7d37a2b6), [`667a0f0`](https://github.com/anza-xyz/kit/commit/667a0f059f5432244ab2cf8a23a22f53c7a36b4b), [`fdfcb6c`](https://github.com/anza-xyz/kit/commit/fdfcb6cbf439eb55e07ad7d59372347bd816d6d3), [`43bc570`](https://github.com/anza-xyz/kit/commit/43bc570a5b51a9fda75abc1f0f818728ca3cd439), [`ffb7665`](https://github.com/anza-xyz/kit/commit/ffb76652f6b887eb5020c3584f1d827a1098dccc)]:
    - @solana/keys@6.8.0
    - @solana/addresses@6.8.0
    - @solana/codecs-core@6.8.0
    - @solana/codecs-data-structures@6.8.0
    - @solana/codecs-numbers@6.8.0
    - @solana/codecs-strings@6.8.0
    - @solana/errors@6.8.0
    - @solana/nominal-types@6.8.0

## 6.7.0

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@6.7.0
    - @solana/codecs-core@6.7.0
    - @solana/codecs-data-structures@6.7.0
    - @solana/codecs-numbers@6.7.0
    - @solana/codecs-strings@6.7.0
    - @solana/errors@6.7.0
    - @solana/keys@6.7.0
    - @solana/nominal-types@6.7.0

## 6.6.0

### Patch Changes

- Updated dependencies [[`7f02d23`](https://github.com/anza-xyz/kit/commit/7f02d23948cc09e3f0bc70931d845569f1cb38ad)]:
    - @solana/errors@6.6.0
    - @solana/addresses@6.6.0
    - @solana/codecs-core@6.6.0
    - @solana/codecs-data-structures@6.6.0
    - @solana/codecs-numbers@6.6.0
    - @solana/codecs-strings@6.6.0
    - @solana/keys@6.6.0
    - @solana/nominal-types@6.6.0

## 6.5.0

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@6.5.0
    - @solana/codecs-core@6.5.0
    - @solana/codecs-data-structures@6.5.0
    - @solana/codecs-numbers@6.5.0
    - @solana/codecs-strings@6.5.0
    - @solana/errors@6.5.0
    - @solana/keys@6.5.0
    - @solana/nominal-types@6.5.0

## 6.4.0

### Patch Changes

- Updated dependencies [[`27c3975`](https://github.com/anza-xyz/kit/commit/27c39755f5185e09a194c0b22eac4286f14c552c)]:
    - @solana/codecs-core@6.4.0
    - @solana/codecs-strings@6.4.0
    - @solana/addresses@6.4.0
    - @solana/codecs-data-structures@6.4.0
    - @solana/codecs-numbers@6.4.0
    - @solana/keys@6.4.0
    - @solana/errors@6.4.0
    - @solana/nominal-types@6.4.0

## 6.3.1

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@6.3.1
    - @solana/codecs-core@6.3.1
    - @solana/codecs-data-structures@6.3.1
    - @solana/codecs-numbers@6.3.1
    - @solana/codecs-strings@6.3.1
    - @solana/errors@6.3.1
    - @solana/keys@6.3.1
    - @solana/nominal-types@6.3.1

## 6.3.0

### Patch Changes

- Updated dependencies [[`f47d5cf`](https://github.com/anza-xyz/kit/commit/f47d5cf30512bbae3233f0ddccae45462af7f309)]:
    - @solana/errors@6.3.0
    - @solana/addresses@6.3.0
    - @solana/codecs-core@6.3.0
    - @solana/codecs-data-structures@6.3.0
    - @solana/codecs-numbers@6.3.0
    - @solana/codecs-strings@6.3.0
    - @solana/keys@6.3.0
    - @solana/nominal-types@6.3.0

## 6.2.0

### Patch Changes

- Updated dependencies [[`0d0be3e`](https://github.com/anza-xyz/kit/commit/0d0be3e18bfbb053b92c4b2d338c5bb0ed414bcc), [`7568a12`](https://github.com/anza-xyz/kit/commit/7568a127e1d1197d2362be464117bc41c82b01ad), [`e33a65f`](https://github.com/anza-xyz/kit/commit/e33a65fd18d52bd2d7a0018ff9a152ff6f43a3b3), [`5390602`](https://github.com/anza-xyz/kit/commit/53906024cffc3facb7259ab65ab974b6b1038f56), [`3f4c5f0`](https://github.com/anza-xyz/kit/commit/3f4c5f003e343c21a785e8f339f84c8d6bd3a3b1), [`49c1195`](https://github.com/anza-xyz/kit/commit/49c1195637a8d550b864918e96d9f9681f658bfe)]:
    - @solana/errors@6.2.0
    - @solana/codecs-data-structures@6.2.0
    - @solana/addresses@6.2.0
    - @solana/codecs-core@6.2.0
    - @solana/codecs-numbers@6.2.0
    - @solana/codecs-strings@6.2.0
    - @solana/keys@6.2.0
    - @solana/nominal-types@6.2.0

## 6.1.0

### Patch Changes

- Updated dependencies [[`70b1ed8`](https://github.com/anza-xyz/kit/commit/70b1ed83be4c5445f81c600a8ca70127dbdf3463), [`3f711e1`](https://github.com/anza-xyz/kit/commit/3f711e16bc38657d5d1ff71cf98e73897ff19ea5), [`215027c`](https://github.com/anza-xyz/kit/commit/215027c49845bd5cbd86d3da396f0c3895283d75), [`7ce7545`](https://github.com/anza-xyz/kit/commit/7ce75455659ace9776042def6774678a81c43a4a)]:
    - @solana/codecs-data-structures@6.1.0
    - @solana/errors@6.1.0
    - @solana/addresses@6.1.0
    - @solana/codecs-core@6.1.0
    - @solana/codecs-numbers@6.1.0
    - @solana/codecs-strings@6.1.0
    - @solana/keys@6.1.0
    - @solana/nominal-types@6.1.0

## 6.0.1

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@6.0.1
    - @solana/codecs-core@6.0.1
    - @solana/codecs-data-structures@6.0.1
    - @solana/codecs-numbers@6.0.1
    - @solana/codecs-strings@6.0.1
    - @solana/errors@6.0.1
    - @solana/keys@6.0.1
    - @solana/nominal-types@6.0.1

## 6.0.0

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@6.0.0
    - @solana/codecs-core@6.0.0
    - @solana/codecs-data-structures@6.0.0
    - @solana/codecs-numbers@6.0.0
    - @solana/codecs-strings@6.0.0
    - @solana/errors@6.0.0
    - @solana/keys@6.0.0
    - @solana/nominal-types@6.0.0

## 5.5.1

### Patch Changes

- Updated dependencies [[`d957526`](https://github.com/anza-xyz/kit/commit/d9575263c3e563c6951cd35bbc6e65e70a0e6a10)]:
    - @solana/errors@5.5.1
    - @solana/addresses@5.5.1
    - @solana/codecs-core@5.5.1
    - @solana/codecs-data-structures@5.5.1
    - @solana/codecs-numbers@5.5.1
    - @solana/codecs-strings@5.5.1
    - @solana/keys@5.5.1
    - @solana/nominal-types@5.5.1

## 5.5.0

### Patch Changes

- Updated dependencies [[`b4f5897`](https://github.com/anza-xyz/kit/commit/b4f5897cab50a92f50b6b390ae76d743173c26dd), [`08c9062`](https://github.com/anza-xyz/kit/commit/08c906299409e82a5941e1044fc6d47d633df784), [`ba3f186`](https://github.com/anza-xyz/kit/commit/ba3f1861a9cb53b4c0e7c6d1b92791d8983e001b), [`1cc0a31`](https://github.com/anza-xyz/kit/commit/1cc0a3163cf884a715aef5ba336adfd980dabfa6), [`6af7c15`](https://github.com/anza-xyz/kit/commit/6af7c156a9cd196d0d5ecb374fe696ec659756bf)]:
    - @solana/errors@5.5.0
    - @solana/addresses@5.5.0
    - @solana/codecs-core@5.5.0
    - @solana/codecs-data-structures@5.5.0
    - @solana/codecs-numbers@5.5.0
    - @solana/codecs-strings@5.5.0
    - @solana/keys@5.5.0
    - @solana/nominal-types@5.5.0

## 5.4.0

### Patch Changes

- [#1187](https://github.com/anza-xyz/kit/pull/1187) [`f5f89eb`](https://github.com/anza-xyz/kit/commit/f5f89eb8e769d5b6056b2f686d51a7ef4a0d1d09) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Make Typescript peer dependency optional + reduce required version to ^5

- Updated dependencies [[`f5f89eb`](https://github.com/anza-xyz/kit/commit/f5f89eb8e769d5b6056b2f686d51a7ef4a0d1d09), [`189de37`](https://github.com/anza-xyz/kit/commit/189de37f76bcb273986d750fd6ed6541f711103b)]:
    - @solana/codecs-data-structures@5.4.0
    - @solana/codecs-numbers@5.4.0
    - @solana/codecs-strings@5.4.0
    - @solana/nominal-types@5.4.0
    - @solana/codecs-core@5.4.0
    - @solana/addresses@5.4.0
    - @solana/errors@5.4.0
    - @solana/keys@5.4.0

## 5.3.0

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@5.3.0
    - @solana/codecs-core@5.3.0
    - @solana/codecs-data-structures@5.3.0
    - @solana/codecs-numbers@5.3.0
    - @solana/codecs-strings@5.3.0
    - @solana/errors@5.3.0
    - @solana/keys@5.3.0
    - @solana/nominal-types@5.3.0

## 5.2.0

### Patch Changes

- Updated dependencies [[`b80b092`](https://github.com/anza-xyz/kit/commit/b80b09239762262116cb70b43271ad98a2f716b5), [`c391a44`](https://github.com/anza-xyz/kit/commit/c391a44eebd26707165991f8837f4d40fa988288), [`109c78e`](https://github.com/anza-xyz/kit/commit/109c78e8972857323558ca913706a95cdb70c549)]:
    - @solana/errors@5.2.0
    - @solana/codecs-core@5.2.0
    - @solana/codecs-numbers@5.2.0
    - @solana/codecs-strings@5.2.0
    - @solana/keys@5.2.0
    - @solana/addresses@5.2.0
    - @solana/codecs-data-structures@5.2.0
    - @solana/nominal-types@5.2.0

## 5.1.0

### Minor Changes

- [#880](https://github.com/anza-xyz/kit/pull/880) [`becf5f6`](https://github.com/anza-xyz/kit/commit/becf5f63f1b97d43109b2488c7cd0806ce6329f4) Thanks [@steveluscher](https://github.com/steveluscher)! - Added codecs for encoding and decoding Solana Offchain Messages (see https://github.com/solana-foundation/SRFCs/discussions/3)

- [#984](https://github.com/anza-xyz/kit/pull/984) [`32214f5`](https://github.com/anza-xyz/kit/commit/32214f57cfb79fb2566e773acec71635bac641df) Thanks [@steveluscher](https://github.com/steveluscher)! - Added the capability to sign Solana Offchain Messages using a `CryptoKey`

### Patch Changes

- [#1040](https://github.com/anza-xyz/kit/pull/1040) [`32b13a8`](https://github.com/anza-xyz/kit/commit/32b13a8973fe0645af1f87f0068c289730b4062c) Thanks [@OrmEmbaar](https://github.com/OrmEmbaar)! - Add a function called bytesEqual to codecs-core that you can use to compare two byte arrays for equality.

- Updated dependencies [[`becf5f6`](https://github.com/anza-xyz/kit/commit/becf5f63f1b97d43109b2488c7cd0806ce6329f4), [`d7f5a0c`](https://github.com/anza-xyz/kit/commit/d7f5a0c046f0a2f2836554fa671364de0b512e97), [`32214f5`](https://github.com/anza-xyz/kit/commit/32214f57cfb79fb2566e773acec71635bac641df), [`32b13a8`](https://github.com/anza-xyz/kit/commit/32b13a8973fe0645af1f87f0068c289730b4062c)]:
    - @solana/errors@5.1.0
    - @solana/codecs-strings@5.1.0
    - @solana/addresses@5.1.0
    - @solana/codecs-core@5.1.0
    - @solana/codecs-data-structures@5.1.0
    - @solana/codecs-numbers@5.1.0
    - @solana/keys@5.1.0
    - @solana/nominal-types@5.1.0
