import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Text, Tooltip } from '@radix-ui/themes';
import { address, type Lamports } from '@solana/kit';
import { useTrackedDataSwr } from '@solana/react/swr';
import type { UiWalletAccount } from '@wallet-standard/react';
import { useContext, useMemo } from 'react';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';
import { getErrorMessage } from '../errors';
import { ErrorDialog } from './ErrorDialog';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

const seenErrors = new WeakSet();

export function Balance({ account }: Props) {
    const { chain } = useContext(ChainContext);
    const { rpc, rpcSubscriptions } = useContext(RpcContext);
    const accountAddress = address(account.address);
    const spec = useMemo(
        () => ({
            rpcRequest: rpc.getBalance(accountAddress, { commitment: 'confirmed' }),
            rpcSubscriptionRequest: rpcSubscriptions.accountNotifications(accountAddress),
            rpcSubscriptionValueMapper: ({ lamports }: { lamports: Lamports }) => lamports,
            rpcValueMapper: (lamports: Lamports) => lamports,
        }),
        [rpc, rpcSubscriptions, accountAddress],
    );
    const { data, error } = useTrackedDataSwr({ address: accountAddress, chain }, spec);
    if (error && !seenErrors.has(error)) {
        return (
            <>
                <ErrorDialog
                    error={error}
                    key={`${account.address}:${chain}`}
                    onClose={() => {
                        seenErrors.add(error);
                    }}
                    title="Failed to fetch account balance"
                />
                <Text>
                    <Tooltip content={<>Could not fetch balance: {getErrorMessage(error, 'Unknown reason')}</>}>
                        <ExclamationTriangleIcon
                            color="red"
                            style={{ height: 16, verticalAlign: 'text-bottom', width: 16 }}
                        />
                    </Tooltip>
                </Text>
            </>
        );
    } else if (data == null) {
        return <Text>&ndash;</Text>;
    } else {
        const formattedSolValue = new Intl.NumberFormat(undefined, { maximumFractionDigits: 5 }).format(
            // @ts-expect-error This format string is 100% allowed now.
            `${data.value}E-9`,
        );
        return <Text>{`${formattedSolValue} ◎`}</Text>;
    }
}
