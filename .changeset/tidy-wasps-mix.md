---
'@solana/plugin-interfaces': minor
---

Add `ClientWithIdentity` interface for clients that provide a default identity signer. Whereas `ClientWithPayer` describes the signer responsible for paying transaction fees and storage costs, `ClientWithIdentity` describes the signer whose assets the application is acting upon — such as the authority over accounts, tokens, or other on-chain assets owned by the current user. In many apps the payer and identity refer to the same signer, but they can differ when a service pays fees on behalf of a user.
