---
'@solana/codecs-data-structures': major
---

Align the return types of the union, predicate, and pattern-match codecs so that a fixed-size result is only exposed when every branch is fixed-size _and_ of the same statically-known size. Branches whose sizes are unequal or not statically known now widen from `FixedSize*` to `VariableSize*` (when at least one branch is variable-size) or to a plain `Encoder`/`Decoder`/`Codec` (when the branches are fixed-size but their sizes are not statically comparable), matching what these codecs actually produce at runtime.

This is a type-only change with no runtime impact, but it is breaking in two ways:

- **Return types change.** Consumers that relied on the previous (unsound) fixed-size typing — e.g. reading `.fixedSize`, or passing the result where a `FixedSize*` is required — will need to adjust.
- **The predicate and pattern-match signatures changed.** Their value/output type is now inferred from the branch encoders, decoders, or codecs rather than from an explicit type argument. Passing an explicit type argument no longer sets the branch domain: `getPatternMatchEncoder<MyType>([...])` (and the decoder/codec equivalents) now fails to compile, and `getPredicateEncoder<MyType>(...)` silently degrades its return to a plain `Encoder<MyType>`. Instead, type the branch predicates' parameters (e.g. `(value: MyType) => ...`) and let the return type be inferred.
