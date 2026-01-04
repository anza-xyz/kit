import type {
    UiWallet,
    UiWalletAccount,
} from "@wallet-standard/react";
import {
    getUiWalletAccountStorageKey,
    uiWalletAccountBelongsToUiWallet,
    uiWalletAccountsAreSame,
    useWallets
} from "@wallet-standard/react";
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
* @param children 
* @param filterWallet 
* @param stateSync
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
            const savedWalletAccount = findSavedWalletAccount(filteredWallets, savedWalletKey);
            console.log("found saved wallet account, and initialized the selectedWalletAccount:", savedWalletAccount);
            return savedWalletAccount;
        });

    // Public setter: mark the per-instance ref synchronously to avoid races, then schedule state update.
    // useCallback stabilises the setter for consumers.
    const setSelectedWalletAccount: React.Dispatch<
        React.SetStateAction<SelectedWalletAccountState>
    > = React.useCallback(setStateAction => {
        wasSetterInvokedRef.current = true;
        console.log("setSelectedWalletAccount invoked with:", setStateAction);
        setSelectedWalletAccountInternal(prevSelectedWalletAccount => {
            const nextWalletAccount =
                typeof setStateAction === 'function' ? setStateAction(prevSelectedWalletAccount) : setStateAction;
            return nextWalletAccount;
        });
    }, [setSelectedWalletAccountInternal]);

    //Sync to persistant storage when selectedWalletAccount changes
    React.useEffect(() => {
        console.log("syncing selected account to storage:", selectedWalletAccount);
        if (!wasSetterInvokedRef.current) return;

        const accountKey = selectedWalletAccount
            ? getUiWalletAccountStorageKey(selectedWalletAccount)
            : undefined;

        if (accountKey) {
            console.log("Storing selected wallet account key:", accountKey);
            stateSync.storeSelectedWallet(accountKey);
        } else {
            stateSync.deleteSelectedWallet();
        }
    }, [selectedWalletAccount, stateSync]);


    //Auto-restore saved wallet account if it appears later, 
    //and if the user hasn't made an explicit choice yet.
    React.useEffect(() => {
        console.log("checking for saved wallet account to restore...");
        if (wasSetterInvokedRef.current) return;
        const savedWalletKey = stateSync.getSelectedWallet();
        const savedAccount = findSavedWalletAccount(filteredWallets, savedWalletKey);
        if (savedAccount && selectedWalletAccount && uiWalletAccountsAreSame(savedAccount, selectedWalletAccount)) {
            console.log("Saved wallet account is already in selectedWalletAccount, no need to restore.");
            return;
        }
        if (savedAccount) {
            console.log("Restoring saved wallet account:", savedAccount);
            setSelectedWalletAccountInternal(savedAccount);
        }
    }, [filteredWallets, stateSync, selectedWalletAccount]);

    const walletAccount = React.useMemo(() => {
        console.log("resolving walletAccount");
        console.log("selectedWalletAccount:", selectedWalletAccount);
        console.log("available filteredWallets:", filteredWallets);
        if (!selectedWalletAccount) return;
        for (const wallet of filteredWallets) {
            for (const account of wallet.accounts) {
                if (uiWalletAccountsAreSame(account, selectedWalletAccount)) {
                    console.log("Found matching wallet account:", account);
                    return account;
                }
            }
            if (uiWalletAccountBelongsToUiWallet(selectedWalletAccount, wallet) && wallet.accounts[0]) {
                console.log("Selected wallet account's wallet is available, returning first account from that wallet:", wallet.accounts[0]);
                return wallet.accounts[0];
            }
            console.log("No matching account in wallet:", wallet.name);
        }
    }, [selectedWalletAccount, filteredWallets]);

    console.log("derived walletAccount:", walletAccount);

    React.useEffect(() => {
        // If there is a selected wallet account but the wallet to which it belongs has since
        // disconnected, clear the selected wallet. This is an automatic cleanup and should not
        // mark the 'wasSetterInvoked' ref (so we use the internal setter).
        // Cleanup shouldn't be run if user has made a selection or selectedWalletAccount/walletAccount are loading or undefined
        console.log("checking if selectedWalletAccount is still valid...");
        console.log("selectedWalletAccount:", selectedWalletAccount);
        console.log("walletAccount:", walletAccount);
        if (!selectedWalletAccount) return; //still loading ...
        if (!walletAccount || !uiWalletAccountsAreSame(walletAccount, selectedWalletAccount)) {
            console.log("Selected wallet account is no longer valid, clearing it.");
            setSelectedWalletAccountInternal(undefined);
        }
    }, [selectedWalletAccount, walletAccount]);


    return (
        <SelectedWalletAccountContext.Provider value={[selectedWalletAccount, setSelectedWalletAccount]}>
            {children}
        </SelectedWalletAccountContext.Provider>
    )
}