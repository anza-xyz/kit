import { address } from '@solana/addresses';

import { assertIsMessagePartialSigner, isMessagePartialSigner, MessagePartialSigner } from '../message-partial-signer';

const signMessages = () => {};

{
    // [isMessagePartialSigner]: It keeps track of the address type parameter when the address is a valid Address.
    const potentialSigner = { address: address('1'), signMessages };
    if (isMessagePartialSigner(potentialSigner)) {
        potentialSigner satisfies MessagePartialSigner<'1'>;
    }
}

{
    // [assertIsMessagePartialSigner]: It keeps track of the address type parameter when the address is a valid Address.
    const potentialSigner = { address: address('1'), signMessages };
    assertIsMessagePartialSigner(potentialSigner);
    potentialSigner satisfies MessagePartialSigner<'1'>;
}

{
    // [isMessagePartialSigner]: It accepts a class instance, which has no implicit index signature.
    class MyClassBasedSigner implements MessagePartialSigner<'1'> {
        readonly address = address('1');
        signMessages() {
            return Promise.resolve([]);
        }
    }
    const potentialSigner = null as unknown as MyClassBasedSigner;
    if (isMessagePartialSigner(potentialSigner)) {
        potentialSigner satisfies MessagePartialSigner<'1'>;
    }
}

{
    // [assertIsMessagePartialSigner]: It accepts a class instance, which has no implicit index signature.
    class MyClassBasedSigner implements MessagePartialSigner<'1'> {
        readonly address = address('1');
        signMessages() {
            return Promise.resolve([]);
        }
    }
    const potentialSigner = null as unknown as MyClassBasedSigner;
    assertIsMessagePartialSigner(potentialSigner);
    potentialSigner satisfies MessagePartialSigner<'1'>;
}
