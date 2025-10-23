---
'@solana/rpc-types': major
'@solana/errors': major
---

`BorshIoErrors` from the RPC no longer contain an `encodedData` property. This property used to hold the underlying error from the serialization library used on the server. This message was always subject to changes in the version of that library, or changes in the choice of library itself. New versions of the server no longer throw the underlying error, so for consistency it has been removed everywhere in Kit.
