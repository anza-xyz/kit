import { Decoder, fixDecoderSize } from '@solana/codecs-core';
import { getU8Decoder, getU16Decoder, getU32Decoder } from '@solana/codecs-numbers';
import { getUtf8Decoder } from '@solana/codecs-strings';

import { getArrayDecoder } from '../array';
import { createDependentStructDecoder } from '../dependent-struct';
import { b } from './__setup__';

describe('createDependentStructDecoder', () => {
    const dependentStruct = createDependentStructDecoder;
    const u8 = getU8Decoder;
    const u16 = getU16Decoder;
    const u32 = getU32Decoder;

    it('decodes a struct with only static fields', () => {
        const decoder = dependentStruct().field('a', u8()).field('b', u16()).finish();
        expect(decoder.decode(b('010200'))).toStrictEqual({ a: 1, b: 2 });
    });

    it('decodes a struct with a dependent length field', () => {
        const decoder = dependentStruct()
            .field('count', u8())
            .field('items', fields => getArrayDecoder(u32(), { size: fields.count }))
            .finish();
        expect(decoder.decode(b('02010000000200000000'.slice(0, 18)))).toStrictEqual({
            count: 2,
            items: [1, 2],
        });
    });

    it('passes only the fields decoded so far to a factory', () => {
        const seenByFactory: unknown[] = [];
        const decoder = dependentStruct()
            .field('first', u8())
            .field('second', u8())
            .field('third', fields => {
                seenByFactory.push({ ...fields });
                return u8();
            })
            .finish();
        decoder.decode(b('010203'));
        expect(seenByFactory).toStrictEqual([{ first: 1, second: 2 }]);
    });

    const versioned = dependentStruct()
        .field('version', u8())
        .field('payload', fields => (fields.version === 0 ? u16() : u32()))
        .finish();

    it('lets a factory pick the v0 decoder based on a discriminator', () => {
        expect(versioned.decode(b('000100'))).toStrictEqual({ payload: 1, version: 0 });
    });

    it('lets a factory pick the v1 decoder based on a discriminator', () => {
        expect(versioned.decode(b('0101000000'))).toStrictEqual({ payload: 1, version: 1 });
    });

    it('decodes from a non-zero offset and returns the new offset from `read`', () => {
        const decoder = dependentStruct()
            .field('n', u8())
            .field('xs', fields => getArrayDecoder(u8(), { size: fields.n }))
            .finish();
        expect(decoder.read(b('ff03010203'), 1)).toStrictEqual([{ n: 3, xs: [1, 2, 3] }, 5]);
    });

    it('returns an empty record when no fields are added', () => {
        const decoder = dependentStruct().finish();
        expect(decoder.decode(b(''))).toStrictEqual({});
    });

    it('preserves declaration order in the decoded object iteration', () => {
        const decoder = dependentStruct().field('z', u8()).field('a', u8()).field('m', u8()).finish();
        expect(Object.keys(decoder.decode(b('010203')))).toStrictEqual(['z', 'a', 'm']);
    });

    it('produces a variable size decoder', () => {
        const decoder = dependentStruct().field('a', u8()).finish();
        expect(decoder).not.toHaveProperty('fixedSize');
    });

    it('does not mutate the builder when adding a field', () => {
        const builderA = dependentStruct().field('a', u8());
        const builderAB = builderA.field('b', u8());
        const decoderA = builderA.finish() as Decoder<Record<string, number>>;
        const decoderAB = builderAB.finish() as Decoder<Record<string, number>>;
        expect(Object.keys(decoderA.decode(b('01')))).toStrictEqual(['a']);
        expect(Object.keys(decoderAB.decode(b('0102')))).toStrictEqual(['a', 'b']);
    });

    it('builds independent decoders from independent `finish` calls', () => {
        const builder = dependentStruct().field('a', u8());
        const firstDecoder = builder.finish() as Decoder<Record<string, number>>;
        const secondDecoder = builder.finish() as Decoder<Record<string, number>>;
        expect(firstDecoder).not.toBe(secondDecoder);
        expect(firstDecoder.decode(b('07'))).toStrictEqual({ a: 7 });
        expect(secondDecoder.decode(b('09'))).toStrictEqual({ a: 9 });
    });

    it('composes with other variable size decoders', () => {
        const decoder = dependentStruct()
            .field('label', fixDecoderSize(getUtf8Decoder(), 3))
            .field('count', u8())
            .field('items', fields => getArrayDecoder(u8(), { size: fields.count }))
            .finish();
        expect(decoder.decode(b('414243020a0b'))).toStrictEqual({
            count: 2,
            items: [10, 11],
            label: 'ABC',
        });
    });
});
