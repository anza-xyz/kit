---
'@solana/codecs-core': patch
---

Fix `toArrayBuffer` returning the entire backing buffer when given a `Uint8Array` view that starts at byte offset zero but is shorter than its underlying `ArrayBuffer`. This caused `signBytes` and `verifySignature` to operate on the wrong bytes — and `getBase64Decoder().decode()` to include trailing data — for such views, most notably the `messageBytes` of a decoded version 1 transaction, whose wire envelope places the message first and the signatures last
