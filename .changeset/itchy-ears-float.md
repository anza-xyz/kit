---
'@solana/codecs-strings': minor
'@solana/errors': minor
---

Add `fatal`, `ignoreBOM` and `removeNullCharacters` options to the UTF-8 codec. With `fatal`, lone surrogates when encoding and malformed byte sequences when decoding throw a `SolanaError` instead of being replaced with `U+FFFD`. With `ignoreBOM: true`, a leading byte order mark is preserved instead of being stripped. With `removeNullCharacters: false`, null characters are preserved in decoded strings instead of being stripped as padding. On React Native, a leading byte order mark is now stripped by default, consistent with other platforms.
