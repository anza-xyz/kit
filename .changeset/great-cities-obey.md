---
'@solana/codecs-data-structures': minor
'@solana/errors': minor
---

Add a sentinel size strategy to the `array`, `set`, and `map` codecs. Passing a `{ __kind: 'sentinel', sentinel, strategy? }` object as the `size` option ends the collection when the bytes at the next item position match the given `sentinel`, compared at item boundaries only. The optional `strategy` (`'required'` by default, or `'optional'` / `'omitted'`) controls whether the sentinel is written when encoding and required when decoding. This provides codec support for Codama's `sentinelCountNode`.
