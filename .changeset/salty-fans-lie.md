---
'@solana/addresses': minor
---

Added an `OffCurveAddress` type to represent addresses for which there is no associated private key. These are addresses that can not be signed for by keyholders, only by programs. An example of such an address is the address of an associated token account, for which only the Token Program can sign transactions that seek to modify its contents.

 Also added an `offCurveAddress()` function that you can use to assert and coerce an `Address` to an `OffCurveAddress`, as well as an `isOffCurveAddress()` guard function, and a `assertIsOffCurveAddress()` assertion function.
