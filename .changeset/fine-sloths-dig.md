---
'@solana/errors': patch
---

Add `SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LEADER_SCHEDULE_IDENTITY_NOT_FOUND` (`-32022`), the error Agave v4.4.0 and later return from `getLeaderSchedule` when the requested identity is not in the leader schedule. Older servers return an empty object instead.

Error codes that the library has no message for, such as a JSON-RPC error code added in a newer server, no longer throw a `TypeError` while the error message is being built in development mode. They now produce a `SolanaError` with the message `Unknown Solana error code: <code>`. JSON-RPC errors that arrive without structured data now keep the server's message on `context.__serverMessage`, and for unknown codes it is included in that fallback message. `npx @solana/errors decode` now accepts codes it has no message for, with a warning.
