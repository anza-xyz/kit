---
'@solana/react': minor
---

Add `usePlanTransaction`, `usePlanTransactions`, `useSendTransaction`, and `useSendTransactions` hooks for planning and sending transactions from a React component. Each wraps the corresponding capability on a client that has `planAndSendTransactions()` installed, asserting the capability at mount and exposing it as a tracked action (the same `dispatch`/`status`/`data`/`error` shape as `useAction`).
