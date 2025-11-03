---
"@solana/transaction-confirmation": patch
---

Actually fixed a bug where transaction errors discovered during recent transaction confirmation might not be thrown. The fix in #793 was insufficient.
