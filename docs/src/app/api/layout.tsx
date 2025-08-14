import { DocsLayout, DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { apiSource } from '@/lib/source';
import { Sidebar } from '../docs/sidebar';
import { Navbar } from '../docs/navbar';

export default function Layout({ children }: { children: ReactNode }) {
    const baseProps: DocsLayoutProps = {
        ...baseOptions,
        tree: apiSource.pageTree,
    };

    const apiProps: DocsLayoutProps = {
        ...baseProps,
        sidebar: { ...baseProps.sidebar, component: Sidebar(baseProps) },
        nav: { ...baseProps.nav, component: Navbar(baseProps) },
    };

    return <DocsLayout {...apiProps}>{children}</DocsLayout>;
}
