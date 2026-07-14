import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Flex, IconButton, Link, Text, Tooltip } from '@radix-ui/themes';
import { useClient, useSubscription } from '@solana/react';
import { useContext, useMemo } from 'react';

import { ChainContext } from '../context/ChainContext';
import type { AppClient } from '../context/ClientProvider';
import { getErrorMessage } from '../errors';

const slotFormatter = new Intl.NumberFormat();

export function SlotIndicator() {
    const { rpcSubscriptions } = useClient<AppClient>();
    const { solanaExplorerClusterName } = useContext(ChainContext);
    const source = useMemo(() => rpcSubscriptions.slotNotifications(), [rpcSubscriptions]);
    const { data, error, reconnect } = useSubscription(source);

    // Nothing received yet and no error: we're still connecting.
    if (data == null && error == null) {
        return <Text>{'–'}</Text>;
    }
    // Show the latest slot (if any), alongside a reconnect control when the stream has errored.
    return (
        <Flex asChild align="center" gap="1" display="inline-flex">
            <Text>
                {data != null ? (
                    <Link
                        href={`https://explorer.solana.com/block/${data.slot}?cluster=${solanaExplorerClusterName}`}
                        target="_blank"
                    >
                        {slotFormatter.format(data.slot)}
                    </Link>
                ) : null}
                {error != null ? (
                    <Tooltip
                        content={
                            <>
                                Slot stream interrupted: {getErrorMessage(error, 'Unknown reason')}. Click to reconnect.
                            </>
                        }
                    >
                        <IconButton
                            aria-label="Reconnect slot subscription"
                            color="red"
                            onClick={() => reconnect()}
                            size="1"
                            variant="ghost"
                        >
                            <ExclamationTriangleIcon style={{ height: 16, width: 16 }} />
                        </IconButton>
                    </Tooltip>
                ) : null}
            </Text>
        </Flex>
    );
}
