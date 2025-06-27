import { AffinePoint, Brand, EncodedString } from '@solana/nominal-types';

import { Address, address } from '../address';
import { assertIsOffCurveAddress, isOffCurveAddress, OffCurveAddress, offCurveAddress } from '../curve';

address('555555555555555555555555') satisfies Address<'555555555555555555555555'>;
address('555555555555555555555555') satisfies Brand<'555555555555555555555555', 'Address'>;
address('555555555555555555555555') satisfies EncodedString<'555555555555555555555555', 'base58'>;

const addressWithUnknownValidity = address('555555555555555555555555') as Address<'555555555555555555555555'> & {
    some: 1;
};
offCurveAddress(addressWithUnknownValidity) satisfies Address<'555555555555555555555555'>;
offCurveAddress(addressWithUnknownValidity) satisfies AffinePoint<'555555555555555555555555', 'invalid'>;
offCurveAddress(addressWithUnknownValidity) satisfies Brand<'555555555555555555555555', 'Address'>;
offCurveAddress(addressWithUnknownValidity) satisfies EncodedString<'555555555555555555555555', 'base58'>;
offCurveAddress(addressWithUnknownValidity) satisfies OffCurveAddress<'555555555555555555555555'>;
offCurveAddress(addressWithUnknownValidity) satisfies { some: 1 };

void (() => {
    assertIsOffCurveAddress(addressWithUnknownValidity);
    addressWithUnknownValidity satisfies Address<'555555555555555555555555'>;
    addressWithUnknownValidity satisfies AffinePoint<'555555555555555555555555', 'invalid'>;
    addressWithUnknownValidity satisfies Brand<'555555555555555555555555', 'Address'>;
    addressWithUnknownValidity satisfies EncodedString<'555555555555555555555555', 'base58'>;
    addressWithUnknownValidity satisfies OffCurveAddress<'555555555555555555555555'>;
    addressWithUnknownValidity satisfies { some: 1 };
});

if (isOffCurveAddress(addressWithUnknownValidity)) {
    addressWithUnknownValidity satisfies Address<'555555555555555555555555'>;
    addressWithUnknownValidity satisfies AffinePoint<'555555555555555555555555', 'invalid'>;
    addressWithUnknownValidity satisfies Brand<'555555555555555555555555', 'Address'>;
    addressWithUnknownValidity satisfies EncodedString<'555555555555555555555555', 'base58'>;
    addressWithUnknownValidity satisfies OffCurveAddress<'555555555555555555555555'>;
    addressWithUnknownValidity satisfies { some: 1 };
}
