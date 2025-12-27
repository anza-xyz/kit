import { getUiWalletAccountStorageKey, UiWallet, UiWalletAccount, uiWalletAccountBelongsToUiWallet, uiWalletAccountsAreSame, useWallets } from "@wallet-standard/react";
import React, { createContext } from "react";

export type SelectedWalletAccountState = UiWalletAccount | undefined;

export type SelectedWalletAccountContextProviderProps = { children: React.ReactNode } & {
    filterWallet: (wallet: UiWallet) => Boolean,
    stateSync: {
        storeSelectedWallet: (walletId: string) => void,
        getSelectedWallet: () => string | null,
        deleteSelectedWallet: () => void,
    }
};

export const SelectedWalletAccountContext = createContext<
    readonly [
        selectedWalletAccount: SelectedWalletAccountState,
        setSelectedWalletAccount: React.Dispatch<React.SetStateAction<SelectedWalletAccountState>>
    ]>([undefined, function setSelectedWalletAccount() { }]);

/**
 * Returns the saved wallet account when its corresponding wallet, and account is available.
 * @param wallets 
 * @param savedWalletKey 
 * @returns 
 */
function findSavedWalletAccount(wallets: readonly UiWallet[], savedWalletKey: string | null): UiWalletAccount | undefined {
    if (!savedWalletKey) {
        return;
    }
    const [savedWalletName, savedWalletAddress] = savedWalletKey.split(':');
    if (!savedWalletName || !savedWalletAddress) {
        return;
    }
    for (const wallet of wallets) {
        if (wallet.name !== savedWalletName) continue;
        for (const account of wallet.accounts) {
            if (account.address === savedWalletAddress) {
                return account;
            }
        }
    }
}

/**
 * Saves the selected wallet account's storage key to a persistant storage. In future
 * sessions it will try to return that same wallet account, or at least one from the same brand of
 * wallet if the wallet from which it came is still in the Wallet Standard registry.
 * @param param0 
 * @returns 
 */
export function SelectedWalletAccountContextProvider(
    { children, filterWallet, stateSync }: SelectedWalletAccountContextProviderProps) {
    const wallets = useWallets();
    const filteredWallets = React.useMemo(() => wallets.filter(filterWallet), [wallets, filterWallet]);

    const wasSetterInvokedRef = React.useRef(false);

    const [selectedWalletAccount, setSelectedWalletAccountInternal] = React.useState<SelectedWalletAccountState>(
        () => {
            const savedWalletKey = stateSync.getSelectedWallet();
            return findSavedWalletAccount(filteredWallets, savedWalletKey);
        });

    // Public setter: mark the per-instance ref synchronously to avoid races, then schedule state update.
    // useCallback stabilises the setter for consumers.
    const setSelectedWalletAccount: React.Dispatch<
        React.SetStateAction<SelectedWalletAccountState>
    > = React.useCallback(setStateAction => {
        wasSetterInvokedRef.current = true;
        setSelectedWalletAccountInternal(prevSelectedWalletAccount => {
            const nextWalletAccount =
                typeof setStateAction === 'function' ? setStateAction(prevSelectedWalletAccount) : setStateAction;
            const accountKey = nextWalletAccount ? getUiWalletAccountStorageKey(nextWalletAccount) : undefined;
            if (accountKey) {
                stateSync.storeSelectedWallet(accountKey);
            } else {
                stateSync.deleteSelectedWallet();
            }
            return nextWalletAccount;
        });
    }, [stateSync]);

    //Auto-restore saved wallet account if it appears later, 
    //and if the user hasn't made an explicit choice yet.
    React.useEffect(() => {
        if (wasSetterInvokedRef.current || selectedWalletAccount) return;
        const savedWalletKey = stateSync.getSelectedWallet();
        const savedAccount = findSavedWalletAccount(filteredWallets, savedWalletKey);
        if (savedAccount) {
            setSelectedWalletAccountInternal(savedAccount);
        }
    }, [filteredWallets, filterWallet, stateSync, selectedWalletAccount]);

    const walletAccount = React.useMemo(() => {
        if (!selectedWalletAccount) return;
        for (const wallet of filteredWallets) {
            for (const account of wallet.accounts) {
                if (uiWalletAccountsAreSame(account, selectedWalletAccount)) {
                    return account;
                }
            }
            if (uiWalletAccountBelongsToUiWallet(selectedWalletAccount, wallet) && wallet.accounts[0]) {
                return wallet.accounts[0];
            }
        }
    }, [selectedWalletAccount, filteredWallets]);

    React.useEffect(() => {
        // If there is a selected wallet account but the wallet to which it belongs has since
        // disconnected, clear the selected wallet. This is an automatic cleanup and should not
        // mark the 'wasSetterInvoked' ref (so we use the internal setter).
        if (selectedWalletAccount && !walletAccount) {
            setSelectedWalletAccountInternal(undefined);
        }
    }, [selectedWalletAccount, walletAccount]);


    return (
        <SelectedWalletAccountContext.Provider value={[selectedWalletAccount, setSelectedWalletAccount]}>
            {children}
        </SelectedWalletAccountContext.Provider>
    )
}
