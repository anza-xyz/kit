import { Link, Text } from '@radix-ui/themes';
import { useContext, useEffect, useMemo, useSyncExternalStore } from 'react';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';

const slotFormatter = new Intl.NumberFormat();

export function SlotIndicator() {
    const { rpcSubscriptions } = useContext(RpcContext);
    const { chain, solanaExplorerClusterName } = useContext(ChainContext);
    const store = useMemo(
        () => rpcSubscriptions.slotNotifications().reactiveStore(),
        [rpcSubscriptions, chain],
    );

    useEffect(() => {
        store.connect();
        return () => store.reset();
    }, [store]);

    const state = useSyncExternalStore(store.subscribe, store.getUnifiedState);
    if (state.status === 'error') throw state.error;
    if (state.status !== 'loaded') return <Text>{'\u2013'}</Text>;

    return (
        <Link
            href={`https://explorer.solana.com/block/${state.data.slot}?cluster=${solanaExplorerClusterName}`}
            target="_blank"
        >
            {slotFormatter.format(state.data.slot)}
        </Link>
    );
}
