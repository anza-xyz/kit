import { UiWalletAccount } from '@wallet-standard/react';
import React, { createContext } from 'react';

export type SelectedWalletAccountState = UiWalletAccount | undefined;

export type SelectedWalletAccountContextValue = readonly [
    selectedWalletAccount: SelectedWalletAccountState,
    setSelectedWalletAccount: React.Dispatch<React.SetStateAction<SelectedWalletAccountState>>,
];

export const SelectedWalletAccountContext = /*#__PURE__*/ createContext<SelectedWalletAccountContextValue | undefined>(
    undefined,
);

export function useSelectedWalletAccount() {
    const ctx = React.useContext(SelectedWalletAccountContext);
    if (!ctx) {
        throw new Error('useSelectedWalletAccount must be used within a SelectedWalletAccountContextProvider');
    }
    return ctx;
}
