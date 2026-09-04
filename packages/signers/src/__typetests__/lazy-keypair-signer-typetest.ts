import { Address } from '@solana/addresses';

import { createLazyKeyPairSignerFromBytes } from '../lazy-keypair-signer';
import { MessagePartialSigner } from '../message-partial-signer';
import { TransactionPartialSigner } from '../transaction-partial-signer';

{
    // [createLazyKeyPairSignerFromBytes]: It returns a signer implementing both partial signer interfaces.
    const signer = createLazyKeyPairSignerFromBytes(new Uint8Array(64));
    signer satisfies MessagePartialSigner & TransactionPartialSigner;
}

{
    // [createLazyKeyPairSignerFromBytes]: It exposes its address synchronously (not wrapped in a promise).
    const signer = createLazyKeyPairSignerFromBytes(new Uint8Array(64));
    signer.address satisfies Address;
}

{
    // [createLazyKeyPairSignerFromBytes]: It keeps track of the address type parameter.
    const signer = createLazyKeyPairSignerFromBytes<'1'>(new Uint8Array(64));
    signer satisfies MessagePartialSigner<'1'> & TransactionPartialSigner<'1'>;
    signer.address satisfies Address<'1'>;
}

{
    // [createLazyKeyPairSignerFromBytes]: It does not return a full KeyPairSigner (no `keyPair` property).
    const signer = createLazyKeyPairSignerFromBytes(new Uint8Array(64));
    // @ts-expect-error The lazy signer does not expose a `keyPair` property.
    const keyPair = signer.keyPair;
    void keyPair;
}
