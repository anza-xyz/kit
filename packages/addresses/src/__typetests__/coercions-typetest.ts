import { AffinePoint, Brand, EncodedString } from '@solana/nominal-types';

import { Address, address } from '../address';
import { OffCurveAddress, offCurveAddress } from '../curve';

address('555555555555555555555555') satisfies Address<'555555555555555555555555'>;
address('555555555555555555555555') satisfies Brand<'555555555555555555555555', 'Address'>;
address('555555555555555555555555') satisfies EncodedString<'555555555555555555555555', 'base58'>;

offCurveAddress('555555555555555555555555') satisfies Address<'555555555555555555555555'>;
offCurveAddress('555555555555555555555555') satisfies AffinePoint<'555555555555555555555555', 'invalid'>;
offCurveAddress('555555555555555555555555') satisfies Brand<'555555555555555555555555', 'Address'>;
offCurveAddress('555555555555555555555555') satisfies EncodedString<'555555555555555555555555', 'base58'>;
offCurveAddress('555555555555555555555555') satisfies OffCurveAddress<'555555555555555555555555'>;
