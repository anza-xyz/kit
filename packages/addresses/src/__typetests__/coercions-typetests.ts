import { Brand, EncodedString } from '@solana/nominal-types';

import { Address, address } from '../address';

address('555555555555555555555555') satisfies Address<'555555555555555555555555'>;
address('555555555555555555555555') satisfies Brand<'555555555555555555555555', 'Address'>;
address('555555555555555555555555') satisfies EncodedString<'555555555555555555555555', 'base58'>;
