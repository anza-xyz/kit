import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Flex, Text, Tooltip } from '@radix-ui/themes';
import { address, formatDecimalFixedPoint, type Lamports, lamportsToSol } from '@solana/kit';
import { useTrackedDataSWR } from '@solana/react/swr';
import type { UiWalletAccount } from '@wallet-standard/ui';
import { useContext, useMemo } from 'react';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';
import { getErrorMessage } from '../errors';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

const solFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 5 });

export function Balance({ account }: Props) {
    const { chain } = useContext(ChainContext);
    const { rpc, rpcSubscriptions } = useContext(RpcContext);
    const accountAddress = useMemo(() => address(account.address), [account.address]);
    const spec = useMemo(
        () => ({
            initialValueMapper: (lamports: Lamports) => lamports,
            initialValueSource: rpc.getBalance(accountAddress, { commitment: 'confirmed' }),
            streamSource: rpcSubscriptions.accountNotifications(accountAddress),
            streamValueMapper: ({ lamports }: { lamports: Lamports }) => lamports,
        }),
        [rpc, rpcSubscriptions, accountAddress],
    );
    const { data, error } = useTrackedDataSWR({ address: accountAddress, chain }, spec);

    // Nothing fetched yet and no error: we're still loading.
    if (data == null && error == null) {
        return <Text>&ndash;</Text>;
    }
    // Show the latest data (if any), alongside the error (if any).
    const formattedSolValue = data != null ? formatDecimalFixedPoint(solFormatter, lamportsToSol(data.value)) : null;
    return (
        <Flex asChild align="center" gap="1" display="inline-flex">
            <Text>
                {formattedSolValue != null ? `${formattedSolValue} ◎` : null}
                {error != null ? (
                    <Tooltip content={<>Could not refresh balance: {getErrorMessage(error, 'Unknown reason')}</>}>
                        <ExclamationTriangleIcon
                            color="red"
                            style={{ height: 16, verticalAlign: 'text-bottom', width: 16 }}
                        />
                    </Tooltip>
                ) : null}
            </Text>
        </Flex>
    );
}
