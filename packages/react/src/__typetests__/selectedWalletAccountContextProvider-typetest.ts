/* eslint-disable @typescript-eslint/no-unused-vars */
import type { UiWallet, UiWalletAccount } from '@wallet-standard/react';
import React from 'react';

import type { useSelectedWalletAccount } from '../selectedWalletAccountContext';
import { SelectedWalletAccountContextProvider } from '../SelectedWalletAccountContextProvider';

/**
 * Positive: provider accepts correct props.
 */
React.createElement(SelectedWalletAccountContextProvider, {
    children: React.createElement('div', null),
    filterWallet: (_wallet: UiWallet) => true,
    stateSync: {
        deleteSelectedWallet: () => {},
        getSelectedWallet: () => null,
        storeSelectedWallet: (_walletId: string) => {},
    },
});

/**
 * Negative: filterWallet must return a boolean.
 */
React.createElement(SelectedWalletAccountContextProvider, {
    children: React.createElement('div', null),
    //@ts-expect-error filterWallet must return a boolean
    filterWallet: (_wallet: UiWallet) => 'not a boolean',
    stateSync: {
        deleteSelectedWallet: () => {},
        getSelectedWallet: () => null,
        storeSelectedWallet: (_walletId: string) => {},
    },
});

/**
 * Context value: tuple shape and setter behavior.
 */
type CtxValue = ReturnType<typeof useSelectedWalletAccount>;
type SetSelected = CtxValue[1];

declare const setSelected: SetSelected;
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

type SelectedWallet = CtxValue[0];
declare const selected: SelectedWallet;

// type-level assertion helpers
type Assert<T extends true> = T;
// allows undefined
// @ts-expect-error TS6196
type _AssertAllowsUndefined = Assert<undefined extends SelectedWallet ? true : false>;
// allows UiWalletAccount
// @ts-expect-error TS6196
type _AssertAllowsWallet = Assert<UiWalletAccount extends SelectedWallet ? true : false>;

// Positive: selected wallet account can be a UiWalletAccount
// @ts-expect-error TS6196
const _selected2: UiWalletAccount = selected!;

type FilteredWallets = CtxValue[2];
declare const filteredWallets: FilteredWallets;
