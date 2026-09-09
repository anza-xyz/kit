import {
    Codec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '../codec';
import { tapCodec, tapDecoder, tapEncoder } from '../tap-codec';

/**
 * Strict type-equality helper used by typetests below. Resolves to `true` only
 * if `A` and `B` are mutually assignable AND share the same modifier set (`?`,
 * `readonly`); otherwise resolves to `false`.
 *
 * This is stricter than `satisfies` for two reasons:
 *
 * 1. **Bidirectionality.** `A satisfies B` only checks that `A` is assignable
 *    to `B`. A test using `satisfies` passes if the actual type has extra
 *    members beyond what we asserted — which would silently mask a regression
 *    that widened the type.
 * 2. **Modifier strictness.** `A satisfies B` tolerates losing `?` (required
 *    is assignable to optional) and losing `readonly` (readonly is assignable
 *    to mutable). `Equal` distinguishes `{ x: T }` from `{ x?: T }` and from
 *    `{ readonly x: T }` because the inferred-position generic comparison
 *    uses identity rather than assignability for the type parameters.
 *
 * Use `Equal` when the exact shape (including modifiers) matters. Use
 * `satisfies` when one-way assignability is the actual requirement.
 */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// [DESCRIBE] tapEncoder
{
    // It preserves the exact fixed-size encoder type, including extra custom properties.
    {
        type MyEncoder = FixedSizeEncoder<string, 42> & { custom: 42 };
        const encoder = tapEncoder({} as MyEncoder, _ => {});
        encoder satisfies MyEncoder;
        true satisfies Equal<typeof encoder, MyEncoder>;
    }

    // It preserves the exact variable-size encoder type.
    {
        const encoder = tapEncoder({} as VariableSizeEncoder<string>, _ => {});
        encoder satisfies VariableSizeEncoder<string>;
        true satisfies Equal<typeof encoder, VariableSizeEncoder<string>>;
    }

    // It preserves the exact base encoder type.
    {
        const encoder = tapEncoder({} as Encoder<string>, _ => {});
        encoder satisfies Encoder<string>;
        true satisfies Equal<typeof encoder, Encoder<string>>;
    }

    // It infers the tapped value type from the encoder.
    {
        tapEncoder({} as Encoder<string>, value => {
            value satisfies string;
        });
    }
}

// [DESCRIBE] tapDecoder
{
    // It preserves the exact fixed-size decoder type, including extra custom properties.
    {
        type MyDecoder = FixedSizeDecoder<string, 42> & { custom: 42 };
        const decoder = tapDecoder({} as MyDecoder, _ => {});
        decoder satisfies MyDecoder;
        true satisfies Equal<typeof decoder, MyDecoder>;
    }

    // It preserves the exact variable-size decoder type.
    {
        const decoder = tapDecoder({} as VariableSizeDecoder<string>, _ => {});
        decoder satisfies VariableSizeDecoder<string>;
        true satisfies Equal<typeof decoder, VariableSizeDecoder<string>>;
    }

    // It preserves the exact base decoder type.
    {
        const decoder = tapDecoder({} as Decoder<string>, _ => {});
        decoder satisfies Decoder<string>;
        true satisfies Equal<typeof decoder, Decoder<string>>;
    }

    // It infers the tapped value type from the decoder.
    {
        tapDecoder({} as Decoder<string>, value => {
            value satisfies string;
        });
    }
}

// [DESCRIBE] tapCodec
{
    // It preserves the exact fixed-size codec type, including extra custom properties.
    {
        type MyCodec = FixedSizeCodec<string, string, 42> & { custom: 42 };
        const codec = tapCodec(
            {} as MyCodec,
            _ => {},
            _ => {},
        );
        codec satisfies MyCodec;
        true satisfies Equal<typeof codec, MyCodec>;
    }

    // It preserves the exact variable-size codec type.
    {
        const codec = tapCodec(
            {} as VariableSizeCodec<string>,
            _ => {},
            _ => {},
        );
        codec satisfies VariableSizeCodec<string>;
        true satisfies Equal<typeof codec, VariableSizeCodec<string>>;
    }

    // It preserves the exact base codec type.
    {
        const codec = tapCodec(
            {} as Codec<string>,
            _ => {},
            _ => {},
        );
        codec satisfies Codec<string>;
        true satisfies Equal<typeof codec, Codec<string>>;
    }

    // The decode tap is optional.
    {
        const codec = tapCodec({} as Codec<string>, _ => {});
        codec satisfies Codec<string>;
        true satisfies Equal<typeof codec, Codec<string>>;
    }

    // It infers the tapped value types from the codec: `TFrom` on encode, `TTo` on decode.
    {
        tapCodec(
            {} as Codec<number | string, string>,
            value => {
                value satisfies number | string;
            },
            value => {
                value satisfies string;
            },
        );
    }
}
