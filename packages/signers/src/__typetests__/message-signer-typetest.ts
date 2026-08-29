import { address } from '@solana/addresses';

import { MessagePartialSigner } from '../message-partial-signer';
import { assertIsMessageSigner, isMessageSigner, MessageSigner } from '../message-signer';

const signMessages = () => {};

{
    // [isMessageSigner]: It keeps track of the address type parameter when the address is a valid Address.
    const potentialSigner = { address: address('1'), signMessages };
    if (isMessageSigner(potentialSigner)) {
        potentialSigner satisfies MessageSigner<'1'>;
    }
}

{
    // [assertIsMessageSigner]: It keeps track of the address type parameter when the address is a valid Address.
    const potentialSigner = { address: address('1'), signMessages };
    assertIsMessageSigner(potentialSigner);
    potentialSigner satisfies MessageSigner<'1'>;
}

{
    // [isMessageSigner]: It accepts a class instance, which has no implicit index signature.
    class MyClassBasedSigner implements MessagePartialSigner<'1'> {
        readonly address = address('1');
        signMessages() {
            return Promise.resolve([]);
        }
    }
    const potentialSigner = null as unknown as MyClassBasedSigner;
    if (isMessageSigner(potentialSigner)) {
        potentialSigner satisfies MessageSigner<'1'>;
    }
}

{
    // [assertIsMessageSigner]: It accepts a class instance, which has no implicit index signature.
    class MyClassBasedSigner implements MessagePartialSigner<'1'> {
        readonly address = address('1');
        signMessages() {
            return Promise.resolve([]);
        }
    }
    const potentialSigner = null as unknown as MyClassBasedSigner;
    assertIsMessageSigner(potentialSigner);
    potentialSigner satisfies MessageSigner<'1'>;
}
