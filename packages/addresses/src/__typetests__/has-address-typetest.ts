import { Address, HasAddress } from '../address';

// [DESCRIBE] HasAddress
{
    // It is satisfied by any object exposing an Address through an `address` property.
    {
        const wrapper = { address: null as unknown as Address<'1111'> };
        wrapper satisfies HasAddress;
        wrapper satisfies HasAddress<'1111'>;
    }

    // It tracks the address type parameter.
    {
        const wrapper = { address: null as unknown as Address<'1111'> };
        // @ts-expect-error The wrapped address is not of the expected type.
        wrapper satisfies HasAddress<'2222'>;
    }

    // It is not satisfied by objects exposing an unbranded string address.
    {
        const wrapper = { address: '1111' };
        // @ts-expect-error Unbranded strings are not addresses.
        wrapper satisfies HasAddress;
    }

    // It is not satisfied by plain addresses.
    {
        const plainAddress = null as unknown as Address<'1111'>;
        // @ts-expect-error Addresses do not expose an `address` property.
        plainAddress satisfies HasAddress<'1111'>;
    }
}
