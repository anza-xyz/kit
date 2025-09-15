---
'@solana/rpc-transport-http': minor
---

The React Native and Node builds now permit you to set the `Origin` header. This header continues to be forbidden in the browser build, as it features on the list of forbidden request headers: https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header
