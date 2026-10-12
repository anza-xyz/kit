---
'@solana/addresses': minor
---

Allow `getAddressEncoder()` and `getAddressCodec()` to encode any address-bearing object (`HasAddress`) in addition to plain `Address` values, so that signers and framework wrapper classes can be encoded directly without unwrapping them first. Decoders still return a plain `Address`. As a result, the encoder input type of codecs composing an address codec (e.g. a struct with an address field) is now inferred as `Address | HasAddress` instead of `Address`.

```ts
const addressEncoder = getAddressEncoder();
addressEncoder.encode(signer); // Same bytes as `addressEncoder.encode(signer.address)`.
```
