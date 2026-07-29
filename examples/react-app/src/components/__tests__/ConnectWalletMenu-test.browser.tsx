import { Theme } from '@radix-ui/themes';
import { useWallets } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';
import type { ReactNode } from 'react';

import { render } from '../../__test-utils__/render';
import { useDisplayedWallet } from '../../hooks/useDisplayedWallet';
import { ConnectWalletMenu } from '../ConnectWalletMenu';

jest.mock('@solana/react', () => ({ useClient: jest.fn() }));
jest.mock('@solana/kit-plugin-wallet/react', () => ({ useWallets: jest.fn(() => []) }));
jest.mock('../../hooks/useDisplayedWallet', () => ({ useDisplayedWallet: jest.fn() }));
jest.mock('../WalletAccountIcon', () => ({ WalletAccountIcon: () => null }));

const mockUseDisplayedWallet = useDisplayedWallet as jest.Mock;
// The repo's shared Jest config sets `resetMocks: true`, which strips even an initial factory
// implementation before every test runs — so `useWallets` and `useClient` must be given their
// return values explicitly in `beforeEach` rather than relying on the factories above.
const mockUseWallets = useWallets as jest.Mock;
const mockUseClient = useClient as jest.Mock;

function Wrapper({ children }: { children: ReactNode }) {
    return <Theme>{children}</Theme>;
}

function connection(address: string) {
    return { account: { address }, signer: {}, wallet: {} };
}

describe('ConnectWalletMenu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseWallets.mockReturnValue([]);
        mockUseClient.mockReturnValue({ chain: 'solana:devnet' });
    });

    it('shows the connected account, enabled, when ready', () => {
        mockUseDisplayedWallet.mockReturnValue({ connected: connection('ABCDEFGH1234'), isStale: false });
        const { container } = render(<ConnectWalletMenu>Connect Wallet</ConnectWalletMenu>, { wrapper: Wrapper });
        const button = container.querySelector('button')!;
        expect(container.textContent).toContain('ABCDEFGH');
        expect(button.disabled).toBe(false);
        expect(button.style.opacity).toBe('');
    });

    it('holds the account, disabled and dimmed, while stale — never flashing "Connect Wallet"', () => {
        mockUseDisplayedWallet.mockReturnValue({ connected: connection('ABCDEFGH1234'), isStale: true });
        const { container } = render(<ConnectWalletMenu>Connect Wallet</ConnectWalletMenu>, { wrapper: Wrapper });
        const button = container.querySelector('button')!;
        expect(container.textContent).toContain('ABCDEFGH');
        expect(container.textContent).not.toContain('Connect Wallet');
        expect(button.disabled).toBe(true);
        expect(button.style.opacity).toBe('0.5');
        expect(button.style.pointerEvents).toBe('none');
    });

    it('shows the connect affordance when settled and disconnected', () => {
        mockUseDisplayedWallet.mockReturnValue({ connected: null, isStale: false });
        const { container } = render(<ConnectWalletMenu>Connect Wallet</ConnectWalletMenu>, { wrapper: Wrapper });
        expect(container.textContent).toContain('Connect Wallet');
        expect(container.querySelector('button')!.disabled).toBe(false);
    });
});
