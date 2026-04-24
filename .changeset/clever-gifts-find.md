---
'@solana/plugin-core': patch
---

Fix `extendClient` so that a later plugin can override a key previously set by an earlier plugin. Previously, chaining two plugins that set the same key threw `TypeError: Cannot redefine property` because the frozen client's non-configurable property descriptors were copied verbatim onto the intermediate object.
