---
'@solana/codecs-core': minor
---

Add `tap` codec helpers for observing values and bytes without modifying them. The value family (`tapEncoder`/`tapDecoder`/`tapCodec`) observes the input value before encoding and the decoded value after decoding, whilst the bytes family (`tapEncoderBytes`/`tapDecoderBytes`/`tapCodecBytes`) observes the raw bytes after encoding and before decoding. Any tap may throw to abort the operation, making these helpers ideal for adding validation guards to existing codecs without an identity `transformEncoder`. For example, `tapDecoderBytes(getBooleanDecoder(), (bytes, offset) => { if (bytes[offset] > 1) throw new Error('Expected a 0 or a 1 for booleans'); })`.
