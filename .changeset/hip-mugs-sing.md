---
'@solana/rpc-api': minor
---

Added the `clientId` field to the `getClusterNodes` response type, exposing the name of the validator client software advertised by each node. Also marked the `tpu` and `tpuForwards` fields as `@deprecated` in favor of their QUIC equivalents (`tpuQuic` and `tpuForwardsQuic`); validators may report the UDP fields as `null`.
