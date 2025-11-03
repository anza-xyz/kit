import { useEffect, useMemo, useState } from 'react';

import type { WalletConnector } from '../client/types';
import type { WalletStandardDiscoveryOptions } from '../wallet/standard';
import { getWalletStandardConnectors, watchWalletStandardConnectors } from '../wallet/standard';

/**
 * Collect Wallet Standard connectors and keep the list in sync with runtime registration changes.
 *
 * @param options - Optional discovery overrides that adjust connector metadata before exposure.
 * @returns A deduplicated, memoised list of wallet connectors compatible with Wallet Standard.
 */
export function useWalletStandardConnectors(options?: WalletStandardDiscoveryOptions): readonly WalletConnector[] {
    const overrides = options?.overrides;
    const memoisedOptions = useMemo(() => (overrides ? { overrides } : undefined), [overrides]);
    const [connectors, setConnectors] = useState<readonly WalletConnector[]>(() =>
        getWalletStandardConnectors(memoisedOptions ?? {}),
    );

    useEffect(() => {
        setConnectors(getWalletStandardConnectors(memoisedOptions ?? {}));
        const unwatch = watchWalletStandardConnectors(setConnectors, memoisedOptions ?? {});
        return () => {
            unwatch();
        };
    }, [memoisedOptions]);

    return connectors;
}
