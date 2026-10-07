---
'@solana/fixed-points': patch
---

Allow binary fixed-points whose `fractionalBits` exceed their `totalBits`, e.g. an unsigned 8-bit value with 12 fractional bits representing values in `[0, 1/16)`, consistently with decimal fixed-points whose `decimals` may already exceed their `totalBits`. The `SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS` error is no longer thrown.
