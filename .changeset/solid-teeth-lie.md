---
'@solana/instruction-plans': patch
---

Add the last 8 transaction log lines to the error message of `SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION` and `SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS` (when only one transaction failed).
