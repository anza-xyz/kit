---
'@solana/rpc-types': patch
'@solana/errors': patch
---

Updated the `InstructionError` type based on the fact that the new validator produces errors with the address of the responsible program and its inner instruction index if applicable
