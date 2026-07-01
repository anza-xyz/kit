---
'@solana/codecs-data-structures': patch
---

Allow boolean predicates passed to `getPatternMatchCodec` and `getPatternMatchEncoder` to narrow to a subtype of the variant's value type. Previously, matching against codecs whose value type is a union — such as the number codecs, whose encode type is `number | bigint` — forced predicates to be typed against the full union (e.g. `(value: number | bigint) => …`). The predicate parameter is now checked bivariantly, so a narrower predicate like `(value: number) => …` is accepted, mirroring the ergonomics of `getPredicateCodec` and `getPredicateEncoder`.
