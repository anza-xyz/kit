---
'@solana/rpc-types': patch
---

Correct block transaction metadata types to accept `null` token balances and optional nullable inner instructions across full and accounts responses. Consumers must guard against `null` and omitted fields before array operations. Runtime values are unchanged.
