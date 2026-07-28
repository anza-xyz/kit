import { Theme } from '@radix-ui/themes';
import type { ReactNode } from 'react';

import { render } from '../../__test-utils__/render';
import { Dimmable } from '../Dimmable';

function Wrapper({ children }: { children: ReactNode }) {
    return <Theme>{children}</Theme>;
}

describe('Dimmable', () => {
    it('renders children and is not busy when busy=false', () => {
        const { container, getByText } = render(<Dimmable busy={false}>content</Dimmable>, { wrapper: Wrapper });
        getByText('content');
        const box = container.querySelector('[aria-busy]') as HTMLElement;
        expect(box.getAttribute('aria-busy')).toBe('false');
        expect(box.style.opacity).toBe('1');
        expect(box.style.pointerEvents).toBe('');
    });

    it('marks busy and disables pointer events while busy', () => {
        const { container } = render(<Dimmable busy>content</Dimmable>, { wrapper: Wrapper });
        const box = container.querySelector('[aria-busy="true"]') as HTMLElement;
        expect(box).not.toBeNull();
        expect(box.style.opacity).toBe('0.5');
        expect(box.style.pointerEvents).toBe('none');
    });
});
