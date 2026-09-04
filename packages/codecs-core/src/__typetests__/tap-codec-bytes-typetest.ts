import {
    Codec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    Offset,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '../codec';
import { ReadonlyUint8Array } from '../readonly-uint8array';
import { tapCodecBytes, tapDecoderBytes, tapEncoderBytes } from '../tap-codec-bytes';

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

// [DESCRIBE] tapEncoderBytes
{
    // It preserves the exact fixed-size encoder type, including extra custom properties.
    {
        type MyEncoder = FixedSizeEncoder<string, 42> & { custom: 42 };
        const encoder = tapEncoderBytes({} as MyEncoder, () => {});
        encoder satisfies MyEncoder;
        true satisfies Equal<typeof encoder, MyEncoder>;
    }

    // It preserves the exact variable-size encoder type.
    {
        const encoder = tapEncoderBytes({} as VariableSizeEncoder<string>, () => {});
        encoder satisfies VariableSizeEncoder<string>;
        true satisfies Equal<typeof encoder, VariableSizeEncoder<string>>;
    }

    // It preserves the exact base encoder type.
    {
        const encoder = tapEncoderBytes({} as Encoder<string>, () => {});
        encoder satisfies Encoder<string>;
        true satisfies Equal<typeof encoder, Encoder<string>>;
    }

    // The tap receives readonly bytes and both offsets.
    {
        tapEncoderBytes({} as Encoder<string>, (bytes, preOffset, postOffset) => {
            bytes satisfies ReadonlyUint8Array;
            preOffset satisfies Offset;
            postOffset satisfies Offset;
        });
    }
}

// [DESCRIBE] tapDecoderBytes
{
    // It preserves the exact fixed-size decoder type, including extra custom properties.
    {
        type MyDecoder = FixedSizeDecoder<string, 42> & { custom: 42 };
        const decoder = tapDecoderBytes({} as MyDecoder, () => {});
        decoder satisfies MyDecoder;
        true satisfies Equal<typeof decoder, MyDecoder>;
    }

    // It preserves the exact variable-size decoder type.
    {
        const decoder = tapDecoderBytes({} as VariableSizeDecoder<string>, () => {});
        decoder satisfies VariableSizeDecoder<string>;
        true satisfies Equal<typeof decoder, VariableSizeDecoder<string>>;
    }

    // It preserves the exact base decoder type.
    {
        const decoder = tapDecoderBytes({} as Decoder<string>, () => {});
        decoder satisfies Decoder<string>;
        true satisfies Equal<typeof decoder, Decoder<string>>;
    }

    // The tap receives readonly bytes and the offset.
    {
        tapDecoderBytes({} as Decoder<string>, (bytes, offset) => {
            bytes satisfies ReadonlyUint8Array;
            offset satisfies Offset;
        });
    }
}

// [DESCRIBE] tapCodecBytes
{
    // It preserves the exact fixed-size codec type, including extra custom properties.
    {
        type MyCodec = FixedSizeCodec<string, string, 42> & { custom: 42 };
        const codec = tapCodecBytes(
            {} as MyCodec,
            () => {},
            () => {},
        );
        codec satisfies MyCodec;
        true satisfies Equal<typeof codec, MyCodec>;
    }

    // It preserves the exact variable-size codec type.
    {
        const codec = tapCodecBytes(
            {} as VariableSizeCodec<string>,
            () => {},
            () => {},
        );
        codec satisfies VariableSizeCodec<string>;
        true satisfies Equal<typeof codec, VariableSizeCodec<string>>;
    }

    // It preserves the exact base codec type.
    {
        const codec = tapCodecBytes(
            {} as Codec<string>,
            () => {},
            () => {},
        );
        codec satisfies Codec<string>;
        true satisfies Equal<typeof codec, Codec<string>>;
    }

    // The decode tap is optional.
    {
        const codec = tapCodecBytes({} as Codec<string>, () => {});
        codec satisfies Codec<string>;
        true satisfies Equal<typeof codec, Codec<string>>;
    }
}
