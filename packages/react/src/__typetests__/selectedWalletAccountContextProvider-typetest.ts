import React from 'react';
import type { UiWallet, UiWalletAccount } from '@wallet-standard/react';
import {
    SelectedWalletAccountContext,
    SelectedWalletAccountContextProvider,
} from '../SelectedWalletAccountContextProvider';

/**
 * Positive: provider accepts correct props.
 */
React.createElement(SelectedWalletAccountContextProvider, {
    children: React.createElement('div', null),
    filterWallet: (_wallet: UiWallet) => true,
    stateSync: {
        storeSelectedWallet: (_walletId: string) => {},
        getSelectedWallet: () => null,
        deleteSelectedWallet: () => {},
    },
});

/**
 * Negative: filterWallet must return a boolean.
 */
React.createElement(SelectedWalletAccountContextProvider, {
    //@ts-expect-error filterWallet must return a boolean
    filterWallet: (_wallet: UiWallet) => 'not a boolean',
    stateSync: {
        storeSelectedWallet: (_walletId: string) => {},
        getSelectedWallet: () => null,
        deleteSelectedWallet: () => {},
    },
    children: React.createElement('div', null),
});

/**
 * Context value: tuple shape and setter behavior.
 */
type Ctx = React.ContextType<typeof SelectedWalletAccountContext>;
const ctxValue: Ctx = React.useContext(SelectedWalletAccountContext);
const [, setSelected] = ctxValue;
// Positive: setter accepts undefined
setSelected(undefined);
// Positive: setter accepts an updater function
setSelected(prev => prev);
// Positive: setter accepts a UiWalletAccount value
setSelected({} as UiWalletAccount);
// Negative: setter rejects invalid types
setSelected(
    // @ts-expect-error must be of correct type
    'not a wallet account or undefined',
);
