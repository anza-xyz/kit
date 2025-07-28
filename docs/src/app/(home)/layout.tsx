import type { ReactNode } from 'react';
import { HomeLayout, HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';

export default function Layout({ children }: { children: ReactNode }) {
    const homeProps: HomeLayoutProps = {
        ...baseOptions,
    };

    return <HomeLayout {...homeProps}>{children}</HomeLayout>;
}
