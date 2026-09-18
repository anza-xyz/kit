---
'@solana/instruction-plans': patch
---

Fix `getReallocMessagePackerInstructionPlan` producing a 0-byte instruction when `totalSize` is an exact multiple of the realloc limit (10,240 bytes), which left the account one chunk short of the requested size.
