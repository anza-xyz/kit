---
'@solana/codecs-data-structures': major
---

Correct union, predicate, and pattern-match codec return types so fixed-size results are only exposed when all known branch sizes match. This is a type-only change with no runtime impact, but it is breaking: branches whose fixed sizes are unequal or not statically known now widen from `FixedSize*` to a plain `Encoder`/`Decoder`/`Codec`, so consumers that relied on the previous (unsound) fixed-size typing — e.g. reading `.fixedSize` or passing the result where a `FixedSize*` is required — will need to adjust.
