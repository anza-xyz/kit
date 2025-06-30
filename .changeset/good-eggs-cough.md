---
'@solana/nominal-types': patch
---

Added `AffinePoint`; a nominal type that you can use to tag a value as representing an affine point over some field that is either valid or invalid from the perspective of some curve. Typically this will be used to tag an address as either on or off curve.
