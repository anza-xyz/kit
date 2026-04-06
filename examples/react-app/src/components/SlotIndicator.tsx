import { Link, Text } from '@radix-ui/themes';
import { useContext, useEffect, useState, useSyncExternalStore } from 'react';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';

type SlotNotification = Readonly<{
    parent: bigint;
    root: bigint;
    slot: bigint;
}>;

type ReactiveStore<T> = {
    getError(): unknown;
    getState(): T | undefined;
    subscribe(callback: () => void): () => void;
};

function createNoopStore(error?: unknown): ReactiveStore<SlotNotification> {
    return {
        getError: () => error,
        getState: () => undefined,
        subscribe: () => () => { },
    };
}

const slotFormatter = new Intl.NumberFormat();

export function SlotIndicator() {
    const { rpcSubscriptions } = useContext(RpcContext);
    const { chain, solanaExplorerClusterName } = useContext(ChainContext);
    const [store, setStore] = useState<ReactiveStore<SlotNotification>>(createNoopStore);

    useEffect(() => {
        const abortController = new AbortController();
        rpcSubscriptions
            .slotNotifications()
            .reactive({ abortSignal: abortController.signal })
            .then(setStore)
            .catch(e => setStore(createNoopStore(e)));
        return () => abortController.abort();
    }, [rpcSubscriptions, chain]);

    const slot = useSyncExternalStore(store.subscribe, () => {
        if (store.getError()) throw store.getError();
        return store.getState();
    });

    if (!slot) {
        return <Text>{'\u2013'}</Text>;
    }

    return (
        <Link
            href={`https://explorer.solana.com/block/${slot.slot}?cluster=${solanaExplorerClusterName}`}
            target="_blank"
        >
            {slotFormatter.format(slot.slot)}
        </Link>
    );
}
