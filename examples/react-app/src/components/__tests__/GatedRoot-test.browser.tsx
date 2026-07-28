import { Theme } from '@radix-ui/themes';
import type { ReactNode } from 'react';

import { render } from '../../__test-utils__/render';
import { useHasWalletSettled } from '../../hooks/useHasWalletSettled';
import { GatedRoot } from '../GatedRoot';

jest.mock('../../hooks/useHasWalletSettled', () => ({ useHasWalletSettled: jest.fn() }));
jest.mock('../../routes/root', () => ({ __esModule: true, default: () => <div data-testid="root-view">root</div> }));

const mockUseHasWalletSettled = useHasWalletSettled as jest.Mock;

function Wrapper({ children }: { children: ReactNode }) {
    return <Theme>{children}</Theme>;
}

describe('GatedRoot', () => {
    beforeEach(() => jest.clearAllMocks());

    it('shows the connecting placeholder (not Root) before the wallet first settles', () => {
        mockUseHasWalletSettled.mockReturnValue(false);
        const { queryByTestId, container } = render(<GatedRoot />, { wrapper: Wrapper });
        expect(queryByTestId('root-view')).toBeNull();
        expect(container.textContent).toContain('Connecting to your wallet');
    });

    it('renders Root once the wallet has settled', () => {
        mockUseHasWalletSettled.mockReturnValue(true);
        const { queryByTestId } = render(<GatedRoot />, { wrapper: Wrapper });
        expect(queryByTestId('root-view')).not.toBeNull();
    });
});
