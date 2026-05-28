import { Text } from '@radix-ui/themes';
import { useRequestSwr } from '@solana/react/swr';
import { useContext } from 'react';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';

const epochFormatter = new Intl.NumberFormat();

export function EpochIndicator() {
    const { rpc } = useContext(RpcContext);
    const { chain } = useContext(ChainContext);
    const { data, error } = useRequestSwr(['epochInfo', chain], rpc.getEpochInfo());
    if (error) throw error;
    if (!data) return <Text>{'–'}</Text>;
    return <Text>{epochFormatter.format(data.epoch)}</Text>;
}
