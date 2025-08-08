import { baseOptions } from '@/app/layout.config';
import { docsSource } from '@/lib/source';
import { DocsLayout, DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';

export default function Layout({ children }: { children: ReactNode }) {
    const baseProps: DocsLayoutProps = {
        ...baseOptions,
        tree: docsSource.pageTree,
    };

    const docsProps: DocsLayoutProps = {
        ...baseProps,
        sidebar: { ...baseProps.sidebar, component: Sidebar(baseProps) },
        nav: { ...baseProps.nav, component: Navbar(baseProps) },
    };

    return <DocsLayout {...docsProps}>{children}</DocsLayout>;
}
