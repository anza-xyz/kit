import { ReactNode } from 'react';

export function Spread({ children }: { children: ReactNode }) {
    return (
        <div className="2xl:-mx-[min(8em,calc(calc(100vw-100%-var(--fd-sidebar-width)-var(--fd-toc-width)-8em)/2))]">
            {children}
        </div>
    );
}
