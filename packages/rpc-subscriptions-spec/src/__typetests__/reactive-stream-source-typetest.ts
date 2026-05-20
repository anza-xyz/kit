import type { ReactiveStreamSource } from '@solana/subscribable';

import { PendingRpcSubscriptionsRequest } from '../rpc-subscriptions-request';

// `PendingRpcSubscriptionsRequest<T>` is structurally assignable to `ReactiveStreamSource<T>` —
// the duck-type reactive-framework bindings consume so they don't have to name a concrete
// producer type.
null as unknown as PendingRpcSubscriptionsRequest<number> satisfies ReactiveStreamSource<number>;
null as unknown as PendingRpcSubscriptionsRequest<{ foo: string }> satisfies ReactiveStreamSource<{
    foo: string;
}>;
