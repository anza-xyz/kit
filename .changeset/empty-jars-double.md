---
'@solana/plugin-core': patch
---

Flatten the inferred return type of `extendClient` and `withCleanup` so that chained `.use()` calls on a `Client` no longer produce deeply nested `Omit<Omit<Omit<...>>>` types in editor tooltips and error messages. The inferred shape now displays as a single flat object literal at every step of the chain, while optional (`?`) and `readonly` modifiers, symbol keys, and override semantics are preserved exactly as before. Also exports the new `ExtendedClient<TClient, TAdditions>` helper type for plugin authors who write their own merging helpers and want the same flattening guarantee.
