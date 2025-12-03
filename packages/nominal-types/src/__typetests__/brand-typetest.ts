import { Brand } from '../index';

// [DESCRIBE] Brand.
{
    // Unbranded values do not satisfy a branded type
    {
        // @ts-expect-error The base value is identical, but the brand differs
        'abc' satisfies Brand<'abc', 'Brand'>;
    }

    // Identical base values only satisfy their own brand.
    {
        const a = 'abc' as Brand<'abc', 'BrandA'>;
        // @ts-expect-error The base value is identical, but the brand differs
        a satisfies Brand<'abc', 'BrandB'>;
    }
}
