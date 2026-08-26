---
'@solana/transaction-messages': minor
'@solana/errors': minor
---

Add validation of transaction heap frame size. The new `assertIsValidHeapSize` helper (and the canonical `MIN_HEAP_FRAME_SIZE`, `MAX_HEAP_FRAME_SIZE`, and `HEAP_FRAME_SIZE_MULTIPLE` constants) enforce that a heap size is a finite integer within `[32 KiB, 256 KiB]` and a multiple of `1 KiB`. `setTransactionMessageHeapSize` and `setTransactionMessageConfig` now validate the supplied heap size, throwing `SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE` on invalid input. Decoding remains permissive and does not validate.
