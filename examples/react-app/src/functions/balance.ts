import {
    AccountNotificationsApi,
    Address,
    createReactiveStoreWithInitialValueAndSlotTracking,
    GetBalanceApi,
    Lamports,
    Rpc,
    RpcSubscriptions,
} from '@solana/kit';
import { SWRSubscription } from 'swr/subscription';

/**
 * This is an example of a strategy to fetch some account data and to keep it up to date over time.
 * It's implemented as an SWR subscription function (https://swr.vercel.app/docs/subscription) but
 * the approach is generalizable.
 *
 * It uses {@link createReactiveStoreWithInitialValueAndSlotTracking} to combine an initial RPC fetch with an
 * ongoing subscription, using slot-based comparison to ensure only the latest value is published.
 */
export function balanceSubscribe(
    rpc: Rpc<GetBalanceApi>,
    rpcSubscriptions: RpcSubscriptions<AccountNotificationsApi>,
    ...subscriptionArgs: Parameters<SWRSubscription<{ address: Address }, Lamports>>
) {
    const [{ address }, { next }] = subscriptionArgs;
    const abortController = new AbortController();
    const store = createReactiveStoreWithInitialValueAndSlotTracking({
        abortSignal: abortController.signal,
        rpcRequest: rpc.getBalance(address, { commitment: 'confirmed' }),
        rpcSubscriptionRequest: rpcSubscriptions.accountNotifications(address),
        rpcSubscriptionValueMapper: ({ lamports }) => lamports,
        rpcValueMapper: lamports => lamports,
    });
    store.subscribe(() => {
        const error = store.getError();
        if (error) {
            next(error as Error);
        } else {
            next(null, store.getState()?.value);
        }
    });
    return () => {
        abortController.abort();
    };
}
