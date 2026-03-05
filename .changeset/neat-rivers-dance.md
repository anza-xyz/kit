---
'@solana/errors': patch
---

Remove stale `$encodedData` interpolation from the `BORSH_IO_ERROR` message. The `encodedData` context property was removed in v5.0.0 but the message template was not updated, causing the literal `$encodedData` to appear in the rendered error message.
