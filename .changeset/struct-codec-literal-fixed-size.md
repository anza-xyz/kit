---
'@solana/codecs-data-structures': patch
---

Infer a literal `fixedSize` for `getStructEncoder`, `getStructDecoder`, and `getStructCodec`

When every field is fixed-size, the struct codecs now type their `fixedSize` as the literal sum of the field sizes (for example `5`) instead of the broad `number`. This lets size-aware combinators such as `getUnion*`, `getPredicate*`, and `getPatternMatch*` tell struct branches of different sizes apart. Structs whose fields sum to more than 512 bytes, or that contain a single field larger than that, keep the `number` size so the type-level addition can never exceed TypeScript's recursion limit. This is a type-only change; the runtime is unchanged.
