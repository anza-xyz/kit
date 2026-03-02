---
'@solana/codecs-data-structures': patch
---

Enable pattern match encoder/codec to use type narrowing. This means that if your predicate narrows the type of the value, then the matching encoder only needs to handle the narrowed type.

This means that you can write, for example:

```ts
getPatternMatchEncoder<string | number>([
    [(value) => typeof value === 'string', {} as Encoder<string>],
    [(value) => typeof value === 'number', {} as Encoder<number>]
])
```
