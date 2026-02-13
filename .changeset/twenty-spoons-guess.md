---
'@solana/codecs-data-structures': minor
---

Allow passing a description to array and tuple encoders and codecs

- The `ArrayCodecConfig` is extended with an optional description
- The tuple encoder and codec now have an optional second argument, which is a new config object `TupleCodecConfig` with an optional description
- If either throws a `SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS` when encoding, the `codecDescription` field will be the description passed in the config. If no description is included then they will continue to default to `array` and `tuple` respectively. 