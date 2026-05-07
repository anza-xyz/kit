import type { ReactiveActionSource } from '@solana/subscribable';

import { PendingRpcRequest } from '../rpc';

// `PendingRpcRequest<T>` is structurally assignable to `ReactiveActionSource<T>` — the duck-type
// reactive-framework bindings consume so they don't have to name a concrete producer type.
null as unknown as PendingRpcRequest<number> satisfies ReactiveActionSource<number>;
null as unknown as PendingRpcRequest<{ foo: string }> satisfies ReactiveActionSource<{ foo: string }>;
