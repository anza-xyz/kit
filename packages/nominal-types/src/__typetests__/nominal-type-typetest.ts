import { NominalType } from '../index';

// [DESCRIBE] NominalType.
{
    // It adds a particularly named readonly property/value to any type
    {
        const typedValue = null as unknown as NominalType<'foo', 'bar'>;
        typedValue satisfies { readonly ['__foo:@solana/kit']: 'bar' };
    }
}
