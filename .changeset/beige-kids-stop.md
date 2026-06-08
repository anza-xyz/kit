---
'@solana/codecs-data-structures': minor
---

Add `createDependentStructDecoder`, a fluent builder for a struct decoder whose later fields may depend on the decoded values of earlier ones. Each call to `field` adds a name and either a static `Decoder` or a factory that receives a snapshot of the fields decoded so far. Calling `finish` produces a `VariableSizeDecoder` for the accumulated struct.

This is useful for binary formats where a count, version, or discriminator that appears near the start of the struct controls how a later field must be parsed, such as the per-instruction headers in a v1 transaction message.

```ts
const decoder = createDependentStructDecoder()
    .field('count', getU8Decoder())
    .field('values', fields => getArrayDecoder(getU32Decoder(), { size: fields.count }))
    .finish();
```
