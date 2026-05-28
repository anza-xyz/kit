import { Link, Text } from '@radix-ui/themes';
import { useSubscription } from '@solana/react';
import { useContext, useMemo } from 'react';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';

const slotFormatter = new Intl.NumberFormat();

export function SlotIndicator() {
    const { rpcSubscriptions } = useContext(RpcContext);
    const { solanaExplorerClusterName } = useContext(ChainContext);
    const source = useMemo(() => rpcSubscriptions.slotNotifications(), [rpcSubscriptions]);
    const { data, error, status } = useSubscription(source);
    if (status === 'error') throw error;
    if (status !== 'loaded' || data == null) return <Text>{'–'}</Text>;

    return (
        <Link
            href={`https://explorer.solana.com/block/${data.slot}?cluster=${solanaExplorerClusterName}`}
            target="_blank"
        >
            {slotFormatter.format(data.slot)}
        </Link>
    );
}
