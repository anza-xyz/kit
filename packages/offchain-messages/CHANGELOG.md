# @solana/offchain-messages

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
