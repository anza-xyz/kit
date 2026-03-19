---
"@solana/plugin-interfaces": minor
---

Add `ClientWithGetMinimumBalance` plugin interface for computing the minimum balance required for an account. Implementations can use any strategy (e.g., RPC call, cached value) to provide this value through a uniform API.
