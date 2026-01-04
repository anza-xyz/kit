import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import {
    SelectedWalletAccountContext,
    SelectedWalletAccountContextProvider
} from "../SelectedWalletAccountContextProvider";

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

let renderCount = 0;
function Consumer() {
    renderCount++;
    if (renderCount > 10) {
        throw new Error("Too many re-renders");
    }
    const [selectedWalletAccount, setSelectedWalletAccount] = React.useContext(SelectedWalletAccountContext);
    return (
        <div>
            <div data-testid="selected">{selectedWalletAccount ? selectedWalletAccount.address : 'none'}</div>
            <button data-testid="pick-b" onClick={() => setSelectedWalletAccount({ address: '0xabc', walletName: 'WalletB' } as any)}>
                Pick B
            </button>
            <button data-testid="clear" onClick={() => setSelectedWalletAccount(undefined)}>
                Clear
            </button>
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

    test("initializes from saved key", () => {
        //saved key matchs a wallet that is available from useWallets
        const stateSync = {
            getSelectedWallet: jest.fn().mockReturnValue("WalletA:0x123"),
            storeSelectedWallet: jest.fn(),
            deleteSelectedWallet: jest.fn(),
        };

        const walletA = makeWallet("WalletA", ["0x123", "0x456"]);
        const walletB = makeWallet("WalletB", ["0xabc"]);

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

        expect(screen.getByTestId("selected").textContent).toBe("0x123");
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
            makeWallet("WalletA", ["0x123", "0x456"]),
            makeWallet("WalletB", ["0xabc"]),
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
            makeWallet("WalletA", ["0x123", "0x456"]),
            makeWallet("WalletB", ["0xabc"]),
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

        expect(screen.getByTestId("selected").textContent).toBe("0xabc");
        expect(stateSync.storeSelectedWallet).toHaveBeenCalledWith("WalletB:0xabc");
    });

    test("allows changing and clearing selection", async () => {
        const stateSync = {
            getSelectedWallet: jest.fn().mockReturnValue(null),
            storeSelectedWallet: jest.fn((_accountKey: string) => { }),
            deleteSelectedWallet: jest.fn(),
        };

        const mockWallets = [
            makeWallet("WalletA", ["0x123", "0x456"]),
            makeWallet("WalletB", ["0xabc"]),
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

        expect(screen.getByTestId("selected").textContent).toBe("0xabc");
        await waitFor(() => {
            expect(stateSync.storeSelectedWallet).toHaveBeenCalledWith("WalletB:0xabc");
        });

        //Clear
        fireEvent.click(screen.getByTestId("clear"));

        expect(screen.getByTestId("selected").textContent).toBe("none");
        await waitFor(() => expect(stateSync.deleteSelectedWallet).toHaveBeenCalled());
    });

    test

    test('auto-restores saved wallet when it appears later', () => {
        const getSelectedWallet = jest.fn().mockReturnValue('WalletA:0x123');
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
        const mockWalletsUpdated = [makeWallet('WalletA', ['0x123']), makeWallet('WalletB', ['0xabc'])];
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

        expect(screen.getByTestId('selected').textContent).toBe('0x123');
    });

    test("clears in-memory selection when selected wallet disappears", () => {
        const getSelectedWallet = jest.fn().mockReturnValue("WalletA:0x123");
        const storeSelectedWallet = jest.fn();
        const deleteSelectedWallet = jest.fn();

        //First render with WalletA present
        const mockWallets = [
            makeWallet("WalletA", ["0x123", "0x456"]),
            makeWallet("WalletB", ["0xabc"]),
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

        //WalletA:0x123 is selected
        expect(screen.getByTestId("selected").textContent).toBe("0x123");
        expect(getSelectedWallet).toHaveBeenCalled();

        //Now update wallets to remove WalletA
        const mockWalletsUpdated = [
            makeWallet("WalletB", ["0xabc"]),
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