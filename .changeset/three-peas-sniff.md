---
'@solana/rpc-types': minor
'@solana/kit': minor
---

Add `Sol`, `sol()`, `solToLamports`, and `lamportsToSol` helpers for converting between SOL amounts expressed as `@solana/fixed-points` values and `Lamports` branded bigints. Also add `getSolEncoder`, `getSolDecoder`, and `getSolCodec` for serializing SOL amounts to bytes (the encoder accepts both `Sol` and `Lamports` inputs; the decoder always returns `Sol`). Finally, update `getLamportsEncoder`/`getDefaultLamportsEncoder` and their codec counterparts to also accept `Sol` as input.
