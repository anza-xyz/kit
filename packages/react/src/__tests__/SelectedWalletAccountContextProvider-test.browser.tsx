import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { SelectedWalletAccountContextProvider } from "../SelectedWalletAccountContextProvider";
import { useSelectedWalletAccount } from "../selectedWalletAccountContext";

// Mock wallet-standard/react exports the provider depends on
jest.mock("@wallet-standard/react", () => {
    return {
        useWallets: jest.fn(),
        // The provider itself uses only getUiWalletAccountStorageKey, uiWalletAccountsAreSame, uiWalletAccountBelongsToUiWallet
        getUiWalletAccountStorageKey: jest.fn(),
        uiWalletAccountsAreSame: jest.fn(),
        uiWalletAccountBelongsToUiWallet: jest.fn(),
    };
});

import { getUiWalletAccountStorageKey, uiWalletAccountBelongsToUiWallet, uiWalletAccountsAreSame, useWallets } from "@wallet-standard/react";

function makeWallet(name: string, accounts: string[]) {
    return {
        name,
        accounts: accounts.map(addr => ({ address: addr, walletName: name })),
    };
}

/** Used to track and error out on infinite re-renders */
let renderCount = 0;
function Consumer() {
    renderCount++;
    if (renderCount > 10) {
        throw new Error("Too many re-renders");
    }
    const [walletAccount, setWalletAccount, filteredWallets] = useSelectedWalletAccount();
    return (
        <div>
            <div data-testid="selected">{walletAccount ? walletAccount.address : 'none'}</div>
            <button data-testid="pick-b" onClick={() => setWalletAccount({ address: 'abc', walletName: 'WalletB' } as any)}>
                Pick B
            </button>
            <button data-testid="clear" onClick={() => setWalletAccount(undefined)}>
                Clear
            </button>
            <div data-testid="filtered-wallets">{filteredWallets.map(w => w.name).join(", ")}</div>
        </div>
    );
}

describe("SelectedWalletAccountContextProvider", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        //Mock implementations for wallet-standard/react functions
        (getUiWalletAccountStorageKey as jest.Mock).mockImplementation(
            (account) => `${account.walletName}:${account.address}`
        );
        (uiWalletAccountsAreSame as jest.Mock).mockImplementation(
            (a, b) => a?.address === b?.address
        );
        (uiWalletAccountBelongsToUiWallet as jest.Mock).mockImplementation(
            (account, wallet) => account?.walletName === wallet?.name
        );

        renderCount = 0;
    });

    test("only filtered wallets are usable", () => {
        const stateSync = {
            getSelectedWallet: jest.fn(),
            storeSelectedWallet: jest.fn(),
            deleteSelectedWallet: jest.fn(),
        };
        const walletA = makeWallet("WalletA", ["123"]);
        const walletB = makeWallet("WalletB", ["abc"]);
        
        const mockWallets = [
            walletA,
            walletB,
        ];
        (useWallets as jest.Mock).mockReturnValue(mockWallets);
        const allowOnlyA = (wallet: any) => wallet.name === "WalletA";

        render(
            <SelectedWalletAccountContextProvider
                filterWallet={allowOnlyA}
                stateSync={stateSync}
            >
                <Consumer />
            </SelectedWalletAccountContextProvider>
        );

        expect(screen.getByTestId("selected").textContent).toBe("none");
        expect(screen.getByTestId("filtered-wallets").textContent).toContain("WalletA");
        expect(screen.getByTestId("filtered-wallets").textContent).not.toContain("WalletB");

        act(()=>{
            fireEvent.click(screen.getByTestId("pick-b"));
        })

        /** Even if walletB is selected, since it is not available the provider will return 'undefined' for the walletAccount */
        expect(screen.getByTestId("selected").textContent).toBe("none");
    });

    test("initializes from saved key", () => {
        //saved key matchs a wallet that is available from useWallets
        const stateSync = {
            getSelectedWallet: jest.fn().mockReturnValue("WalletA:123"),
            storeSelectedWallet: jest.fn(),
            deleteSelectedWallet: jest.fn(),
        };

        const walletA = makeWallet("WalletA", ["123", "456"]);
        const walletB = makeWallet("WalletB", ["abc"]);

        const mockWallets = [
            walletA,
            walletB,
        ];
        (useWallets as jest.Mock).mockReturnValue(mockWallets);

        const allowWallets = () => true;

        render(
            <SelectedWalletAccountContextProvider
                filterWallet={allowWallets}
                stateSync={stateSync}
            >
                <Consumer />
            </SelectedWalletAccountContextProvider>
        );

        expect(screen.getByTestId("selected").textContent).toBe("123");
        expect(stateSync.getSelectedWallet).toHaveBeenCalled();
    });

    test("initializes with no selection when saved key is invalid", () => {
        //saved key matchs a wallet that is available from useWallets
        const stateSync = {
            getSelectedWallet: jest.fn().mockReturnValue(null),
            storeSelectedWallet: jest.fn(),
            deleteSelectedWallet: jest.fn(),
        };

        const mockWallets = [
            makeWallet("WalletA", ["123", "456"]),
            makeWallet("WalletB", ["abc"]),
        ];
        (useWallets as jest.Mock).mockReturnValue(mockWallets);

        const allowWallets = () => true;

        render(
            <SelectedWalletAccountContextProvider
                filterWallet={allowWallets}
                stateSync={stateSync}
            >
                <Consumer />
            </SelectedWalletAccountContextProvider>
        );

        expect(screen.getByTestId("selected").textContent).toBe("none");
        expect(stateSync.getSelectedWallet).toHaveBeenCalled();
    });

    test("initializes with selected wallet when make a selection from the available wallets", () => {
        const stateSync = {
            getSelectedWallet: jest.fn().mockReturnValue(null),
            storeSelectedWallet: jest.fn((_accountKey: string) => { }),
            deleteSelectedWallet: jest.fn(),
        };

        const mockWallets = [
            makeWallet("WalletA", ["123", "456"]),
            makeWallet("WalletB", ["abc"]),
        ];
        (useWallets as jest.Mock).mockReturnValue(mockWallets);

        const allowWallets = () => true;

        render(
            <SelectedWalletAccountContextProvider
                filterWallet={allowWallets}
                stateSync={stateSync}
            >
                <Consumer />
            </SelectedWalletAccountContextProvider>
        );

        expect(screen.getByTestId("selected").textContent).toBe("none");
        expect(stateSync.getSelectedWallet).toHaveBeenCalled();

        //Make a selection
        act(() => {
            fireEvent.click(screen.getByTestId("pick-b"));
        });

        expect(screen.getByTestId("selected").textContent).toBe("abc");
        expect(stateSync.storeSelectedWallet).toHaveBeenCalledWith("WalletB:abc");
    });

    test("allows changing and clearing selection", async () => {
        const stateSync = {
            getSelectedWallet: jest.fn().mockReturnValue(null),
            storeSelectedWallet: jest.fn((_accountKey: string) => { }),
            deleteSelectedWallet: jest.fn(),
        };

        const mockWallets = [
            makeWallet("WalletA", ["123", "456"]),
            makeWallet("WalletB", ["abc"]),
        ];
        (useWallets as jest.Mock).mockReturnValue(mockWallets);

        const allowWallets = () => true;

        render(
            <SelectedWalletAccountContextProvider
                filterWallet={allowWallets}
                stateSync={stateSync}
            >
                <Consumer />
            </SelectedWalletAccountContextProvider>
        );

        //Initial state
        expect(screen.getByTestId("selected").textContent).toBe("none");

        //Pick B
        fireEvent.click(screen.getByTestId("pick-b"));

        expect(screen.getByTestId("selected").textContent).toBe("abc");
        await waitFor(() => {
            expect(stateSync.storeSelectedWallet).toHaveBeenCalledWith("WalletB:abc");
        });

        //Clear
        fireEvent.click(screen.getByTestId("clear"));

        expect(screen.getByTestId("selected").textContent).toBe("none");
        await waitFor(() => expect(stateSync.deleteSelectedWallet).toHaveBeenCalled());
    });

    test

    test('auto-restores saved wallet when it appears later', () => {
        const getSelectedWallet = jest.fn().mockReturnValue('WalletA:123');
        const storeSelectedWallet = jest.fn();
        const deleteSelectedWallet = jest.fn();

        const allowWallets = () => true;

        //First render with no wallets
        const mockWallets: any[] = [];
        const useWalletsMock = useWallets as jest.Mock;
        useWalletsMock.mockReturnValue(mockWallets);

        const { rerender } = render(
            <SelectedWalletAccountContextProvider
                filterWallet={allowWallets}
                stateSync={{
                    getSelectedWallet,
                    storeSelectedWallet,
                    deleteSelectedWallet
                }}
            >
                <Consumer />
            </SelectedWalletAccountContextProvider>
        );

        //nothing selected yet
        expect(screen.getByTestId('selected').textContent).toContain('none');
        expect(getSelectedWallet).toHaveBeenCalled();

        //Now update wallets to include the saved one
        const mockWalletsUpdated = [makeWallet('WalletA', ['123']), makeWallet('WalletB', ['abc'])];
        useWalletsMock.mockReturnValue(mockWalletsUpdated);

        act(() => {
            rerender(
                <SelectedWalletAccountContextProvider
                    filterWallet={allowWallets}
                    stateSync={{
                        getSelectedWallet,
                        storeSelectedWallet,
                        deleteSelectedWallet
                    }}
                >
                    <Consumer />
                </SelectedWalletAccountContextProvider>
            );
        });

        expect(screen.getByTestId('selected').textContent).toBe('123');
    });

    test("clears in-memory selection when selected wallet disappears", () => {
        const getSelectedWallet = jest.fn().mockReturnValue("WalletA:123");
        const storeSelectedWallet = jest.fn();
        const deleteSelectedWallet = jest.fn();

        //First render with WalletA present
        const mockWallets = [
            makeWallet("WalletA", ["123", "456"]),
            makeWallet("WalletB", ["abc"]),
        ];
        const useWalletsMock = useWallets as jest.Mock;
        useWalletsMock.mockReturnValue(mockWallets);

        const allowWallets = () => true;

        const { rerender } = render(
            <SelectedWalletAccountContextProvider
                filterWallet={allowWallets}
                stateSync={{
                    getSelectedWallet,
                    storeSelectedWallet,
                    deleteSelectedWallet
                }}
            >
                <Consumer />
            </SelectedWalletAccountContextProvider>
        );

        //WalletA:123 is selected
        expect(screen.getByTestId("selected").textContent).toBe("123");
        expect(getSelectedWallet).toHaveBeenCalled();

        //Now update wallets to remove WalletA
        const mockWalletsUpdated = [
            makeWallet("WalletB", ["abc"]),
        ];
        useWalletsMock.mockReturnValue(mockWalletsUpdated);

        act(() => {
            rerender(
                <SelectedWalletAccountContextProvider
                    filterWallet={allowWallets}
                    stateSync={{
                        getSelectedWallet,
                        storeSelectedWallet,
                        deleteSelectedWallet
                    }}
                >
                    <Consumer />
                </SelectedWalletAccountContextProvider>
            );
        });

        expect(screen.getByTestId("selected").textContent).toBe("none");
    });
});