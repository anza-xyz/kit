---
'@solana/rpc-transport-http': patch
---

Stop sending a manual `Content-Length` header from the HTTP transport. The value came from `body.length` — the JavaScript string's UTF-16 code-unit count — which is smaller than the body's actual UTF-8 byte length whenever the payload contains non-ASCII characters. For such payloads the server would respect the header, read only that many bytes off the socket, and stall waiting for a request that the client believed it had already finished sending. The symptom is a hung request rather than a thrown error, and it has been latent since the line was introduced; recent undici versions surface it more readily. The fix is to let `fetch` derive `Content-Length` from the body itself, which it always did anyway. The transport's TypeScript surface and dev-mode runtime check continue to disallow `Content-Length` as a caller-supplied header.
